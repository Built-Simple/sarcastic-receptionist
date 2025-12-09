import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  dailyMoods, 
  responseTemplates, 
  getResponseByIntent, 
  getTimeBasedModifier,
  processTemplate 
} from './personality-config.js';
import { soundEffectUrls, getRandomHoldMusic } from './sound-effects.js';
import { enhanceVoiceResponse, getVoiceForMood, ssmlTemplates, voiceProfiles } from './voice-enhancement-fixed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Track conversations
const conversations = new Map();

// Track voice selection per call
const callVoices = new Map();

// Track call statuses for web interface
const callStatuses = new Map();

// Initialize Twilio client (with graceful handling of missing credentials)
let twilioClient = null;
const SKIP_TWILIO = process.env.SKIP_TWILIO === 'true';

if (!SKIP_TWILIO && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Twilio client:' , error.message);
  }
} else {
  console.log('ℹ️  Running without Twilio (SKIP_TWILIO=true or invalid credentials)');
}

// Get current mood
function getCurrentMood() {
  const day = new Date().getDay();
  return dailyMoods[day];
}

// Enhanced system prompt with current context
function getSystemPrompt() {
  const mood = getCurrentMood();
  const timeModifier = getTimeBasedModifier();
  
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

// Analyze intent from user speech
function analyzeIntent(speech) {
  const lower = speech.toLowerCase();
  
  if (lower.includes('appointment') || lower.includes('schedule') || lower.includes('book')) {
    return 'appointments';
  }
  if (lower.includes('transfer') || lower.includes('speak to') || lower.includes('manager')) {
    return 'transferring';
  }
  if (lower.includes('bye') || lower.includes('thank') || lower.includes('goodbye')) {
    return 'farewells';
  }
  if (lower.includes('hours') || lower.includes('open') || lower.includes('closed')) {
    return 'hours';
  }
  
  return 'general';
}

// Generate response using GPT-4 with personality
async function generateResponse(userInput, conversationHistory = []) {
  try {
    // First try to use a template response
    const intent = analyzeIntent(userInput);
    if (intent !== 'general' && Math.random() > 0.3) {
      const templateResponse = getResponseByIntent(intent);
      return templateResponse.text;
    }
    
    // Otherwise use GPT-4 for dynamic response
    const messages = [
      { role: "system", content: getSystemPrompt() },
      ...conversationHistory,
      { role: "user", content: userInput }
    ];

    const completion = await openai.chat.completions.create({
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

// Log funny interactions
async function logInteraction(callSid, userInput, response, metadata = {}) {
  const timestamp = new Date().toISOString();
  const mood = getCurrentMood();
  
  const logEntry = {
    timestamp,
    callSid,
    mood: mood.name,
    user: userInput,
    receptionist: response,
    ...metadata
  };

  try {
    const logFile = path.join(__dirname, 'interactions.jsonl');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    
    // Also log particularly funny ones separately
    if (response.length > 100 || response.includes("Yale") || response.includes("latte") || metadata.wasHilarious) {
      const funnyLog = path.join(__dirname, 'funny-interactions.log');
      const funnyEntry = `
=== ${timestamp} | ${mood.name} ===
User: ${userInput}
Receptionist: ${response}
${metadata.note ? `Note: ${metadata.note}` : ''}
==================
`;
      await fs.appendFile(funnyLog, funnyEntry);
    }
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

// Get time-appropriate greeting
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Array of proper sarcastic greetings
const sarcasticGreetings = [
  `${getTimeGreeting()}, thank you for calling... uh... this place. I'm your exceptionally motivated receptionist. How may I direct your call into the void?`,
  `Hello, you've reached the front desk of... somewhere important, I'm sure. This is your dedicated receptionist speaking. What crisis can I help you with today?`,
  `${getTimeGreeting()}, thank you for calling. I'm your receptionist, currently questioning all my life choices. How may I assist you?`,
  `Welcome to our establishment. I'm the receptionist, and yes, I'm a real person, unfortunately. How can I help you today?`,
  `Hello, you've reached the reception desk. I'm here, against my better judgment. What do you need?`,
  `Thank you for calling. This is reception, where enthusiasm comes to die. How may I direct your call?`,
  `${getTimeGreeting()}, you've reached... whatever this company is called. I'm your receptionist, tragically. How can I pretend to help you?`,
  `Hello, front desk speaking. I'm your Yale-educated receptionist, making excellent use of my degree. What can I do for you?`,
  `Thank you for calling our prestigious establishment. I'm the receptionist, living the dream... the nightmare, actually. How may I assist?`,
  `Reception desk, this is your overqualified assistant speaking. I was just updating my resume, but I suppose I can help. What do you need?`
];

// Incoming call handler with FIXED voice handling
app.post('/incoming-call', async (req, res) => {
  console.log("📞 Incoming call webhook hit!", req.body);
  console.log('\n📞 Incoming call - Preparing sarcasm...');
  
  try {
    const callSid = req.body.CallSid;
    const fromNumber = req.body.From;
    
    // Initialize conversation tracking
    conversations.set(callSid, {
      history: [],
      callCount: 0,
      startTime: new Date(),
      fromNumber
    });

    const twiml = new twilio.twiml.VoiceResponse();

    // Get a proper sarcastic greeting
    const greeting = sarcasticGreetings[Math.floor(Math.random() * sarcasticGreetings.length)];
    
    // Add initial pause for effect
    twiml.pause({ length: 1 });
    
    // Get voice configuration based on current mood
    const mood = getCurrentMood();
    const voiceConfig = getVoiceForMood(mood.name);
    
    // Pick ONE voice for this entire call and store it
    const selectedVoice = voiceProfiles[voiceConfig.voice].voice;
    callVoices.set(callSid, {
      voice: selectedVoice,
      style: voiceConfig.style
    });
    
    console.log(`📞 Call ${callSid} assigned voice: ${selectedVoice}`);
    
    // Enhance the greeting (now returns plain text with voice settings)
    const enhancedGreeting = enhanceVoiceResponse(greeting, {
      mood: voiceConfig.style,
      voice: voiceConfig.voice,
      addBreathing: false  // Don't add extra breathing to professional greeting
    });

    const gather = twiml.gather({
      input: 'speech',
      speechTimeout: 'auto',
      action: '/handle-speech',
      method: 'POST',
      language: 'en-US',
      speechModel: 'phone_call',
      enhanced: true,
      profanityFilter: false
    });

    // Use Twilio's built-in attributes instead of inline SSML
    gather.say({
      voice: enhancedGreeting.voice,
      rate: enhancedGreeting.rate,
      volume: enhancedGreeting.volume
    }, enhancedGreeting.text);

    // Log the greeting
    await logInteraction(callSid, '[New Call]', greeting);

    console.log('✅ Response sent with voice:', enhancedGreeting.voice);
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error in incoming call:', error);
    
    // Send fallback response
    const fallbackTwiml = new twilio.twiml.VoiceResponse();
    fallbackTwiml.say({
      voice: 'Polly.Amy-Neural'
    }, "Technical difficulties. Apparently even the phone system finds me exhausting. Call back later... or don't.");
    
    res.type('text/xml');
    res.send(fallbackTwiml.toString());
  }
});

// Handle ongoing conversation
app.post('/handle-speech', async (req, res) => {
  console.log('🎙️ HANDLE-SPEECH WEBHOOK HIT!');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  const twiml = new twilio.twiml.VoiceResponse();
  const speechResult = req.body.SpeechResult || "";
  const callSid = req.body.CallSid;
  
  console.log(`💬 User said: "${speechResult}"`);

  // Get conversation context
  const conversation = conversations.get(callSid) || { history: [], callCount: 0 };
  conversation.callCount++;
  
  // Get the voice we assigned to this call
  const callVoice = callVoices.get(callSid) || { voice: 'Polly.Amy-Neural', style: 'sarcastic' };
  console.log(`🎤 Using consistent voice for call ${callSid}: ${callVoice.voice}`);
  
  // Generate response
  let response = await generateResponse(speechResult, conversation.history);
  
  // Add occasional interruptions
  if (Math.random() > 0.85 && conversation.callCount > 2) {
    const interruptions = [
      "... Actually, hold that thought. My assistant just brought me my hourly kombucha.",
      "... Oh wait, I just remembered I have a very important... thing. But continue.",
      "Sorry, I was just checking my stock portfolio. What were you saying?",
      "One second, I need to update my Instagram story about how hard I'm working..."
    ];
    response = interruptions[Math.floor(Math.random() * interruptions.length)] + " " + response;
  }
  
  // Update conversation history
  conversation.history.push(
    { role: "user", content: speechResult },
    { role: "assistant", content: response }
  );
  conversations.set(callSid, conversation);

  // Check if this is a farewell
  const isFarewell = analyzeIntent(speechResult) === 'farewells';

  // Log the interaction
  await logInteraction(callSid, speechResult, response, {
    interactionNumber: conversation.callCount,
    wasHilarious: response.includes("*") || response.length > 100
  });

  if (isFarewell) {
    // Dramatic farewell
    const farewellTemplate = getResponseByIntent('farewells');
    const farewellText = ssmlTemplates.goodbye(farewellTemplate.text);
    
    twiml.say({
      voice: callVoice.voice,  // Same voice for farewell!
      rate: '105%'
    }, farewellText);
    
    twiml.hangup();
    
    // Clean up conversation and voice selection
    conversations.delete(callSid);
    callVoices.delete(callSid);
    console.log(`🔚 Call ${callSid} ended, cleaned up voice selection`);
  } else {
    // Random chance of fake hold (10%)
    if (Math.random() > 0.9 && conversation.callCount > 1) {
      twiml.say({
        voice: callVoice.voice,  // Same voice!
        rate: '105%',
        volume: 'soft'
      }, "... You know what? I need to put you on hold. This conversation is exhausting me.");
      
      // Play hold music
      twiml.play({
        loop: 1
      }, getRandomHoldMusic());
      
      twiml.say({
        voice: callVoice.voice,  // Same voice!
        rate: '105%'
      }, "... ... ... I'm back. That was the best 30 seconds of my day. Now, where were we?");
    }
    
    // Continue conversation
    const gather = twiml.gather({
      input: 'speech',
      speechTimeout: 'auto',
      action: '/handle-speech',
      method: 'POST',
      language: 'en-US',
      speechModel: 'phone_call',
      enhanced: true,
      profanityFilter: false
    });
    
    // Get the voice style based on context (but keep the same voice!)
    const intent = analyzeIntent(speechResult);
    let voiceStyle = callVoice.style;
    if (intent === 'appointments') voiceStyle = 'bored';
    if (intent === 'transferring') voiceStyle = 'passive_aggressive';
    if (conversation.callCount > 5) voiceStyle = 'exhausted';
    
    // Enhance the response with the SAME voice but different style
    const enhancedResponse = enhanceVoiceResponse(response, {
      mood: voiceStyle,
      voice: callVoice.voice.replace('Polly.', '').replace('-Neural', '').toLowerCase(),
      addBreathing: conversation.callCount > 3
    });
    
    // Override the voice to ensure consistency
    enhancedResponse.voice = callVoice.voice;
    
    // Say the response with proper voice attributes
    gather.say({
      voice: enhancedResponse.voice,
      rate: enhancedResponse.rate,
      volume: enhancedResponse.volume
    }, enhancedResponse.text);
    
    // Add occasional passive-aggressive follow-ups
    if (Math.random() > 0.8) {
      gather.pause({ length: 1 });
      
      gather.say({
        voice: callVoice.voice,  // Use the same voice!
        rate: '105%'
      }, "... Anything else I can pretend to help you with?");
    }
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Call status webhook - clean up when calls end
app.post('/call-status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;
  
  console.log(`📞 Call ${callSid} status: ${callStatus}`);
  
  // Update status for web interface
  callStatuses.set(callSid, {
    status: callStatus,
    timestamp: new Date().toISOString()
  });
  
  // Clean up on call completion
  if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
    conversations.delete(callSid);
    callVoices.delete(callSid);
    console.log(`🧹 Cleaned up data for call ${callSid}`);
    
    // Keep status for a while for web interface
    setTimeout(() => {
      callStatuses.delete(callSid);
    }, 60000); // Clean up after 1 minute
  }
  
  res.sendStatus(200);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const mood = getCurrentMood();
  const stats = {
    status: 'unfortunately operational',
    mood: mood.name,
    moodTraits: mood.traits,
    activeConversations: conversations.size,
    serverUptime: process.uptime(),
    currentTime: new Date().toISOString(),
    sarcasmLevel: 'maximum',
    willToLive: 'depleting',
    message: "Yes, it's working. No, I'm not happy about it."
  };
  
  res.json(stats);
});

// Simple test endpoint
app.post('/test-simple', (req, res) => {
  console.log('Test endpoint hit');
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Amy-Neural',
    rate: '95%',
    volume: 'soft'
  }, "... Oh wonderful ... another test call ... This is exactly what I needed today.");
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Web call endpoint - initiate call from web interface
app.post('/web-call', async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ 
      success: false, 
      error: 'Phone number is required' 
    });
  }

  console.log(`🌐 Web call request to: ${phoneNumber}`);

  try {
  // Check if Twilio is available
  if (!twilioClient) {
    return res.status(503).json({ 
      success: false, 
      error: 'Twilio is not configured. Web calling is unavailable.' 
    });
  }
    // Create call using Twilio
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890', // You'll need to add this to .env
      url: (process.env.WEBHOOK_BASE_URL || 'https://sarcastic-receptionist-backup.loca.lt') + '/incoming-call',
      statusCallback: (process.env.WEBHOOK_BASE_URL || 'https://sarcastic-receptionist-backup.loca.lt') + '/call-status',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    console.log(`✅ Call initiated: ${call.sid}`);
    
    // Track the call status
    callStatuses.set(call.sid, {
      status: 'initiated',
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      callSid: call.sid,
      message: 'Call initiated successfully' 
    });
  } catch (error) {
    console.error('Failed to initiate call:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate call. Please try again.' 
    });
  }
});

// Get call status endpoint for web interface
app.get('/call-status/:callSid', (req, res) => {
  const { callSid } = req.params;
  const status = callStatuses.get(callSid);
  
  if (status) {
    res.json(status);
  } else {
    res.json({ 
      status: 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

// Main page
app.get('/', (req, res) => {
  const mood = getCurrentMood();
  
  res.send(`
    <html>
      <head>
        <title>Sarcastic Receptionist (Fixed)</title>
        <style>
          body { font-family: Arial, sans-serif; background: #667eea; color: white; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; }
          h1 { text-align: center; }
          .status { background: rgba(0,255,0,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; }
          code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🙄 Sarcastic Receptionist (FIXED)</h1>
          <div class="status">
            <strong>Status:</strong> Working (no more robot voice!)<br>
            <strong>Mood:</strong> ${mood.name}<br>
            <strong>Fix Applied:</strong> Using Twilio voice attributes instead of inline SSML
          </div>
          
          <h3>Test Endpoints:</h3>
          <ul>
            <li><code>POST /incoming-call</code> - Main receptionist</li>
            <li><code>POST /test-simple</code> - Simple test</li>
          </ul>
          
          <h3>What Was Fixed:</h3>
          <p>✅ <strong>SSML Issue:</strong> No more robot voice speaking XML tags!</p>
          <ul>
            <li>Plain text with ... for pauses</li>
            <li>Twilio's rate and volume attributes</li>
            <li>No inline SSML tags</li>
          </ul>
          
          <p>✅ <strong>Voice Consistency:</strong> One voice per entire call!</p>
          <ul>
            <li>Voice selected at call start</li>
            <li>Same voice for entire conversation</li>
            <li>Different calls get different voices</li>
            <li>No more personality disorder mid-call</li>
          </ul>
          
          <p>✅ <strong>Natural Speech:</strong> No more robot saying "SIGH"!</p>
          <ul>
            <li>*SIGH* → replaced with pauses (...)</li>
            <li>*EYE ROLL* → removed (can't hear it anyway)</li>
            <li>*PAUSE* → replaced with natural breaks</li>
            <li>Sounds human, not robotic</li>
          </ul>
          
          <p>✅ <strong>Professional Greetings:</strong> Proper receptionist opening!</p>
          <ul>
            <li>Starts with "Thank you for calling..." like a real receptionist</li>
            <li>Time-appropriate greetings (morning/afternoon/evening)</li>
            <li>Professional opening before the sass kicks in</li>
            <li>Always ends with "How may I help you?" or similar</li>
          </ul>
          
          <p>✅ <strong>Web Interface:</strong> Test from your browser!</p>
          <ul>
            <li>Beautiful dark-themed interface</li>
            <li>Click-to-call functionality</li>
            <li>Real-time status updates</li>
            <li>Embeddable widget for any website</li>
          </ul>
          
          <h3>🌐 Web Interface</h3>
          <p>
            <a href="/index.html" style="color: #f06292; font-size: 18px;">📞 Test the Receptionist</a><br>
            <a href="/embed-demo.html" style="color: #ba68c8;">🔧 Widget Demo & Documentation</a><br>
            <a href="/health" style="color: #4caf50;">📊 Check Health Status</a>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const mood = getCurrentMood();
  
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🙄  SARCASTIC RECEPTIONIST (FIXED) v3.4                    ║
║                                                               ║
║   Status: Working Without Speaking XML Tags                   ║
║   Port: ${PORT}                                              ║
║   Mood: ${mood.name.padEnd(45)}║
║                                                               ║
║   Fixes Applied:                                              ║
║   ✓ No more robot voice (using Twilio attributes)           ║
║   ✓ One consistent voice per entire call                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📞 Webhook URL: https://your-domain.com/incoming-call
🧪 Test URL: https://your-domain.com/test-simple
🌐 Web Interface: http://localhost:${PORT}/
📱 Widget Demo: http://localhost:${PORT}/embed-demo.html
😤 Current Mood Traits:
   ${mood.traits.map(t => `• ${t}`).join('\n   ')}

*DEEP SIGH* Ready for calls... again...
  `);
});