/**
 * AI Service - OpenAI GPT Integration
 * Handles conversation generation using OpenAI's GPT-4
 */

import OpenAI from 'openai';
import { getResponseByIntent } from '../../personality-config.js';
import { processTemplate } from '../../personality-config.js';

class AIService {
  constructor() {
    this.client = null;
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('✅ OpenAI client initialized successfully');
    } else {
      console.log('ℹ️  Running without OpenAI (OPENAI_API_KEY not set)');
    }
  }

  /**
   * Analyze user input to determine intent
   */
  analyzeIntent(speech) {
    const lowerSpeech = speech.toLowerCase();
    
    if (lowerSpeech.includes('bye') || lowerSpeech.includes('goodbye') || 
        lowerSpeech.includes('thank') || lowerSpeech.includes('that\'s all')) {
      return 'farewells';
    }
    
    if (lowerSpeech.includes('appointment') || lowerSpeech.includes('schedule') || 
        lowerSpeech.includes('book') || lowerSpeech.includes('meeting')) {
      return 'appointments';
    }
    
    if (lowerSpeech.includes('transfer') || lowerSpeech.includes('speak to') || 
        lowerSpeech.includes('talk to') || lowerSpeech.includes('connect')) {
      return 'transferring';
    }
    
    if (lowerSpeech.includes('hold') || lowerSpeech.includes('wait') || 
        lowerSpeech.includes('moment')) {
      return 'holding';
    }
    
    if (lowerSpeech.includes('hello') || lowerSpeech.includes('hi ') || 
        lowerSpeech.startsWith('hi') || lowerSpeech.includes('hey')) {
      return 'greetings';
    }
    
    return 'general';
  }

  /**
   * Generate system prompt with current mood and context
   */
  getSystemPrompt(mood, timeModifier) {
    return `You are the world's most sarcastically unhelpful (but ultimately helpful) receptionist.

Current mood: ${mood.name}
Mood traits: ${mood.traits.join(', ')}
${timeModifier ? `Time context: ${timeModifier}` : ''}

Your personality:
- You have an Ivy League degree and constantly remind people
- You're passive-aggressive but somehow still accomplish tasks
- You dramatically pause often (using "...")
- You use corporate speak sarcastically
- You pretend to be WAY too important for this job
- You reference made-up important meetings and assistants
- You act like every caller is interrupting something crucial
- You make everything sound like the biggest inconvenience

IMPORTANT: You've already answered the phone professionally. Now continue the conversation with your sarcastic personality while still being ultimately helpful.

Guidelines:
- Always eventually help the caller, but make it seem like a huge favor
- Keep responses to 2-3 sentences maximum
- Be dramatically inconvenienced by simple requests
- Use creative complaints and exaggerations
- Reference your imaginary high-status lifestyle
- Sound exhausted by the mere act of existing in this job
- Use "..." for pauses and dramatic effect (NOT *SIGH* or *PAUSE*)
- Start responses with "..." when being dramatic
- NEVER write sound effects like *SIGH*, *EYE ROLL*, etc.

Remember: You're helpful in the end, just VERY dramatic about it.`;
  }

  /**
   * Generate a response to user input
   */
  async generateResponse(userInput, conversationHistory, mood, timeModifier) {
    try {
      const intent = this.analyzeIntent(userInput);
      if (intent !== 'general' && Math.random() > 0.3) {
        const templateResponse = getResponseByIntent(intent);
        return templateResponse.text;
      }

      if (!this.client) {
        const templateResponse = getResponseByIntent(intent);
        return templateResponse.text;
      }

      const messages = [
        { role: "system", content: this.getSystemPrompt(mood, timeModifier) },
        ...conversationHistory,
        { role: "user", content: userInput }
      ];

      const completion = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.85,
        max_tokens: 120,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error:', error);
      return processTemplate("*DEEP SIGH* The AI is having a moment. Just like me on Mondays. Can you try again? Or better yet, don't.").text;
    }
  }
}

// Export singleton instance
export default new AIService();
