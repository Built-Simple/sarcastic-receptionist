// Knowledge Base Module with URL-based Data Fetching
// Fetches, caches, and searches company knowledge for the receptionist

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class KnowledgeBase {
  constructor(config = {}) {
    this.config = {
      // URL to fetch knowledge base from (can be JSON, API endpoint, Google Sheet, etc)
      sourceUrl: config.sourceUrl || process.env.KNOWLEDGE_BASE_URL || null,

      // Local cache settings
      cacheDir: config.cacheDir || path.join(__dirname, 'knowledge-cache'),
      cacheFile: config.cacheFile || 'knowledge-base.json',

      // Update settings
      updateInterval: config.updateInterval || 3600000, // 1 hour default
      autoUpdate: config.autoUpdate !== false, // Default true

      // Fuzzy matching threshold (0-1, higher = stricter matching)
      matchThreshold: config.matchThreshold || 0.6,

      // Enable debug logging
      debug: config.debug || false
    };

    this.knowledge = {
      company: {},
      services: [],
      faqs: [],
      policies: [],
      contacts: [],
      hours: {},
      locations: [],
      customData: {}
    };

    this.lastUpdate = null;
    this.updateTimer = null;
    this.initialized = false;
  }

  // Initialize and load knowledge base
  async init() {
    try {
      // Ensure cache directory exists
      await fs.mkdir(this.config.cacheDir, { recursive: true });

      // Try to load from cache first
      const cached = await this.loadFromCache();
      if (cached) {
        this.knowledge = cached.data;
        this.lastUpdate = cached.timestamp;
        this.log('Loaded knowledge base from cache');
      }

      // Fetch fresh data if needed
      if (!cached || this.isStale()) {
        await this.fetchFromUrl();
      }

      // Start auto-update if enabled
      if (this.config.autoUpdate && this.config.sourceUrl) {
        this.startAutoUpdate();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[KnowledgeBase] Initialization error:', error);

      // Try to use cache even if fetch fails
      const cached = await this.loadFromCache();
      if (cached) {
        this.knowledge = cached.data;
        this.lastUpdate = cached.timestamp;
        this.initialized = true;
        return true;
      }

      return false;
    }
  }

  // Fetch knowledge base from URL
  async fetchFromUrl() {
    if (!this.config.sourceUrl) {
      this.log('No source URL configured, using default/cached data');
      return false;
    }

    try {
      this.log(`Fetching knowledge base from: ${this.config.sourceUrl}`);

      const response = await fetch(this.config.sourceUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Sarcastic-Receptionist-KB/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Process and validate the data
      this.knowledge = this.processKnowledgeData(data);
      this.lastUpdate = new Date().toISOString();

      // Save to cache
      await this.saveToCache();

      this.log('Successfully updated knowledge base from URL');
      return true;
    } catch (error) {
      console.error('[KnowledgeBase] Fetch error:', error);
      return false;
    }
  }

  // Process raw knowledge data into structured format
  processKnowledgeData(data) {
    // Handle different data formats
    if (data.knowledge) {
      // Already in our format
      return data.knowledge;
    }

    // Build knowledge structure from raw data
    const processed = {
      company: data.company || this.knowledge.company || {},
      services: data.services || this.knowledge.services || [],
      faqs: data.faqs || this.knowledge.faqs || [],
      policies: data.policies || this.knowledge.policies || [],
      contacts: data.contacts || this.knowledge.contacts || [],
      hours: data.hours || this.knowledge.hours || {},
      locations: data.locations || this.knowledge.locations || [],
      customData: data.customData || data.custom || this.knowledge.customData || {}
    };

    // Process FAQs to ensure they have required fields
    if (processed.faqs && Array.isArray(processed.faqs)) {
      processed.faqs = processed.faqs.map(faq => {
        if (typeof faq === 'string') {
          return { question: faq, answer: 'I\'ll need to check on that for you.' };
        }
        return {
          question: faq.question || faq.q || '',
          answer: faq.answer || faq.a || '',
          category: faq.category || 'general',
          keywords: faq.keywords || this.extractKeywords(faq.question || '')
        };
      });
    }

    return processed;
  }

  // Search knowledge base for relevant information
  async search(query, context = {}) {
    if (!this.initialized) {
      await this.init();
    }

    const results = {
      exact: [],
      relevant: [],
      suggested: [],
      confidence: 0
    };

    const queryLower = query.toLowerCase();
    const queryWords = this.tokenize(queryLower);

    // Search through different knowledge categories

    // 1. Check FAQs
    if (this.knowledge.faqs) {
      for (const faq of this.knowledge.faqs) {
        const score = this.calculateRelevance(query, faq.question, faq.keywords);
        if (score > 0.9) {
          results.exact.push({
            type: 'faq',
            question: faq.question,
            answer: faq.answer,
            score
          });
        } else if (score > this.config.matchThreshold) {
          results.relevant.push({
            type: 'faq',
            question: faq.question,
            answer: faq.answer,
            score
          });
        }
      }
    }

    // 2. Check for hours/schedule queries
    if (this.isHoursQuery(queryLower) && this.knowledge.hours) {
      results.exact.push({
        type: 'hours',
        answer: this.formatHours(this.knowledge.hours),
        score: 1.0
      });
    }

    // 3. Check for location queries
    if (this.isLocationQuery(queryLower) && this.knowledge.locations) {
      const locationInfo = this.formatLocations(this.knowledge.locations);
      if (locationInfo) {
        results.exact.push({
          type: 'location',
          answer: locationInfo,
          score: 1.0
        });
      }
    }

    // 4. Check for service queries
    if (this.knowledge.services) {
      const relevantServices = this.findRelevantServices(query);
      if (relevantServices.length > 0) {
        results.relevant.push({
          type: 'services',
          items: relevantServices,
          answer: this.formatServices(relevantServices),
          score: 0.8
        });
      }
    }

    // 5. Check for contact queries
    if (this.isContactQuery(queryLower) && this.knowledge.contacts) {
      const contactInfo = this.findRelevantContact(query);
      if (contactInfo) {
        results.exact.push({
          type: 'contact',
          answer: contactInfo,
          score: 0.9
        });
      }
    }

    // 6. Check policies
    if (this.knowledge.policies) {
      const relevantPolicies = this.findRelevantPolicies(query);
      if (relevantPolicies.length > 0) {
        results.relevant.push({
          type: 'policy',
          items: relevantPolicies,
          answer: this.formatPolicies(relevantPolicies),
          score: 0.7
        });
      }
    }

    // Sort results by score
    results.exact.sort((a, b) => b.score - a.score);
    results.relevant.sort((a, b) => b.score - a.score);

    // Calculate overall confidence
    if (results.exact.length > 0) {
      results.confidence = results.exact[0].score;
    } else if (results.relevant.length > 0) {
      results.confidence = results.relevant[0].score;
    }

    return results;
  }

  // Get a direct answer from search results
  getAnswer(searchResults, personality = 'sarcastic') {
    if (!searchResults || searchResults.confidence === 0) {
      return null;
    }

    // Get the best result
    const bestResult = searchResults.exact[0] || searchResults.relevant[0];
    if (!bestResult) return null;

    let answer = bestResult.answer;

    // Add personality wrapper based on type
    if (personality === 'sarcastic') {
      const wrappers = {
        faq: [
          "Oh, this old question... ",
          "Since you asked SO nicely... ",
          "Fine, I'll tell you... ",
          "*SIGH* According to our policy... "
        ],
        hours: [
          "Let me check my VERY important calendar... ",
          "As if I don't have these memorized... ",
          "Since you couldn't Google this yourself... "
        ],
        location: [
          "GPS broken? Fine... ",
          "Let me draw you a map with my words... ",
          "If you MUST know where we are... "
        ],
        services: [
          "Oh, you want to know what we actually DO here? ",
          "Let me enlighten you about our offerings... ",
          "Prepare to be amazed by our services... "
        ]
      };

      const wrapper = wrappers[bestResult.type];
      if (wrapper) {
        answer = wrapper[Math.floor(Math.random() * wrapper.length)] + answer;
      }
    }

    return answer;
  }

  // Helper methods

  isHoursQuery(query) {
    const hoursKeywords = ['hours', 'open', 'close', 'closed', 'schedule', 'when are you', 'business hours', 'opening', 'closing'];
    return hoursKeywords.some(keyword => query.includes(keyword));
  }

  isLocationQuery(query) {
    const locationKeywords = ['where', 'location', 'address', 'directions', 'find you', 'located', 'near'];
    return locationKeywords.some(keyword => query.includes(keyword));
  }

  isContactQuery(query) {
    const contactKeywords = ['contact', 'email', 'phone', 'reach', 'call', 'speak to', 'manager', 'supervisor'];
    return contactKeywords.some(keyword => query.includes(keyword));
  }

  formatHours(hours) {
    if (typeof hours === 'string') return hours;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formatted = [];

    for (const day of days) {
      if (hours[day]) {
        formatted.push(`${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours[day]}`);
      }
    }

    return formatted.length > 0 ? formatted.join(', ') : 'Hours not available';
  }

  formatLocations(locations) {
    if (!locations || locations.length === 0) return null;

    if (locations.length === 1) {
      const loc = locations[0];
      return `${loc.address || loc.name}, ${loc.city || ''} ${loc.state || ''} ${loc.zip || ''}`.trim();
    }

    return `We have ${locations.length} locations. The main one is at ${locations[0].address || locations[0].name}`;
  }

  formatServices(services) {
    if (!services || services.length === 0) return null;

    if (services.length === 1) {
      return services[0].description || services[0].name;
    }

    const names = services.slice(0, 3).map(s => s.name).join(', ');
    return `We offer ${names}${services.length > 3 ? ', and more' : ''}`;
  }

  formatPolicies(policies) {
    if (!policies || policies.length === 0) return null;

    return policies[0].description || policies[0].summary || 'Policy information available upon request';
  }

  findRelevantServices(query) {
    if (!this.knowledge.services) return [];

    return this.knowledge.services.filter(service => {
      const score = this.calculateRelevance(
        query,
        service.name + ' ' + (service.description || ''),
        service.keywords || []
      );
      return score > this.config.matchThreshold;
    });
  }

  findRelevantContact(query) {
    if (!this.knowledge.contacts) return null;

    // Look for specific department mentions
    for (const contact of this.knowledge.contacts) {
      if (query.includes(contact.department?.toLowerCase() || '')) {
        return `${contact.department}: ${contact.phone || contact.email || 'Contact main desk'}`;
      }
    }

    // Return general contact
    const general = this.knowledge.contacts.find(c => c.type === 'general' || c.department === 'general');
    if (general) {
      return `${general.phone || general.email || 'Please hold for transfer'}`;
    }

    return null;
  }

  findRelevantPolicies(query) {
    if (!this.knowledge.policies) return [];

    return this.knowledge.policies.filter(policy => {
      const score = this.calculateRelevance(
        query,
        policy.title + ' ' + (policy.description || ''),
        policy.keywords || []
      );
      return score > this.config.matchThreshold;
    });
  }

  calculateRelevance(query, text, keywords = []) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match
    if (textLower === queryLower) return 1.0;

    // Contains full query
    if (textLower.includes(queryLower) || queryLower.includes(textLower)) return 0.9;

    // Keyword matching
    if (keywords.length > 0) {
      const keywordMatches = keywords.filter(k => queryLower.includes(k.toLowerCase())).length;
      if (keywordMatches > 0) {
        return Math.min(0.85, 0.5 + (keywordMatches / keywords.length) * 0.35);
      }
    }

    // Word overlap
    const queryWords = this.tokenize(queryLower);
    const textWords = this.tokenize(textLower);

    const overlap = queryWords.filter(word => textWords.includes(word)).length;
    const score = overlap / Math.max(queryWords.length, 1);

    return score;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  extractKeywords(text) {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'to', 'from'];
    return this.tokenize(text).filter(word => !stopWords.includes(word));
  }

  // Cache management

  async loadFromCache() {
    try {
      const cachePath = path.join(this.config.cacheDir, this.config.cacheFile);
      const data = await fs.readFile(cachePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async saveToCache() {
    try {
      const cachePath = path.join(this.config.cacheDir, this.config.cacheFile);
      const cacheData = {
        timestamp: this.lastUpdate,
        data: this.knowledge
      };
      await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
      return true;
    } catch (error) {
      console.error('[KnowledgeBase] Cache save error:', error);
      return false;
    }
  }

  isStale() {
    if (!this.lastUpdate) return true;

    const age = Date.now() - new Date(this.lastUpdate).getTime();
    return age > this.config.updateInterval;
  }

  // Auto-update management

  startAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      this.fetchFromUrl().catch(error => {
        console.error('[KnowledgeBase] Auto-update error:', error);
      });
    }, this.config.updateInterval);

    this.log(`Auto-update started (interval: ${this.config.updateInterval}ms)`);
  }

  stopAutoUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
      this.log('Auto-update stopped');
    }
  }

  // Manual update
  async update() {
    return await this.fetchFromUrl();
  }

  // Add custom knowledge
  async addCustomKnowledge(key, value) {
    this.knowledge.customData[key] = value;
    await this.saveToCache();
  }

  // Logging
  log(message) {
    if (this.config.debug) {
      console.log(`[KnowledgeBase] ${message}`);
    }
  }

  // Get stats
  getStats() {
    return {
      initialized: this.initialized,
      lastUpdate: this.lastUpdate,
      sourceUrl: this.config.sourceUrl,
      faqCount: this.knowledge.faqs?.length || 0,
      serviceCount: this.knowledge.services?.length || 0,
      policyCount: this.knowledge.policies?.length || 0,
      contactCount: this.knowledge.contacts?.length || 0,
      hasHours: !!this.knowledge.hours && Object.keys(this.knowledge.hours).length > 0,
      hasLocations: !!this.knowledge.locations && this.knowledge.locations.length > 0
    };
  }
}

export default KnowledgeBase;