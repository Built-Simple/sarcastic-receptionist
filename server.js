/**
 * Sarcastic Receptionist - Main Server
 * AI-powered phone receptionist using Twilio + OpenAI
 *
 * Refactored: Services extracted to src/services/
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { aiService, twilioService, conversationService, loggerService, voiceService } from './src/services/index.js';
import { getRandomGreeting } from './src/config/greetings.js';
import { getRandomInterruption, shouldInterrupt } from './src/config/interruptions.js';
import { getCurrentMood, getCurrentTimeModifier } from './src/utils/time-utils.js';
import { analyzeIntent } from './src/utils/intent-analyzer.js';
import { getResponseByIntent } from './personality-config.js';
import { ssmlTemplates } from './voice-enhancement-fixed.js';
import { getRandomHoldMusic } from './sound-effects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/incoming-call', async (req, res) => {
  console.log("📞 Incoming call webhook hit!", req.body);

  try {
    const callSid = req.body.CallSid;
    const fromNumber = req.body.From;

    conversationService.createConversation(callSid, fromNumber);

    const twiml = twilioService.createVoiceResponse();
    const greeting = getRandomGreeting();
    const mood = getCurrentMood();
    const voiceSelection = voiceService.selectVoiceForCall(mood);

    conversationService.setCallVoice(callSid, voiceSelection.voice, voiceSelection.style);
    console.log(`📞 Call ${callSid} assigned voice: ${voiceSelection.voice}`);

    const enhancedGreeting = voiceService.enhanceResponse(greeting, {
      mood: voiceSelection.style,
      voice: voiceService.normalizeVoiceName(voiceSelection.voice),
      addBreathing: false
    });

    twilioService.addPause(twiml, 1);

    const gather = twilioService.createGather(twiml);
    twilioService.addSay(gather, enhancedGreeting.text, {
      voice: enhancedGreeting.voice,
      rate: enhancedGreeting.rate,
      volume: enhancedGreeting.volume
    });

    await loggerService.logInteraction(callSid, '[New Call]', greeting, { mood: mood.name });

    console.log('✅ Response sent with voice:', enhancedGreeting.voice);
    res.type('text/xml').send(twilioService.toXml(twiml));

  } catch (error) {
    console.error('Error in incoming call:', error);
    const fallbackTwiml = twilioService.createVoiceResponse();
    twilioService.addSay(fallbackTwiml,
      "Technical difficulties. Apparently even the phone system finds me exhausting. Call back later... or don't.",
      { voice: 'Polly.Amy-Neural' }
    );
    res.type('text/xml').send(twilioService.toXml(fallbackTwiml));
  }
});

app.post('/handle-speech', async (req, res) => {
  console.log('🎙️ HANDLE-SPEECH WEBHOOK HIT!');
  const twiml = twilioService.createVoiceResponse();
  const speechResult = req.body.SpeechResult || "";
  const callSid = req.body.CallSid;

  console.log(`💬 User said: "${speechResult}"`);

  const conversation = conversationService.getConversation(callSid);
  conversationService.incrementCallCount(callSid);
  const callVoice = conversationService.getCallVoice(callSid);

  console.log(`🎤 Using consistent voice for call ${callSid}: ${callVoice.voice}`);

  const mood = getCurrentMood();
  const timeModifier = getCurrentTimeModifier();
  let response = await aiService.generateResponse(speechResult, conversation.history, mood, timeModifier);

  if (shouldInterrupt(conversation.callCount)) {
    response = getRandomInterruption() + " " + response;
  }

  conversationService.updateConversation(callSid, speechResult, response);

  const intent = analyzeIntent(speechResult);
  const isFarewell = intent === 'farewells';

  await loggerService.logInteraction(callSid, speechResult, response, {
    mood: mood.name,
    interactionNumber: conversation.callCount + 1,
    wasHilarious: response.includes("*") || response.length > 100
  });

  if (isFarewell) {
    const farewellTemplate = getResponseByIntent('farewells');
    const farewellText = ssmlTemplates.goodbye(farewellTemplate.text);

    twilioService.addSay(twiml, farewellText, { voice: callVoice.voice, rate: '105%' });
    twilioService.addHangup(twiml);
    conversationService.cleanupCall(callSid);
    console.log(`🔚 Call ${callSid} ended`);
  } else {
    if (Math.random() > 0.9 && conversation.callCount > 1) {
      twilioService.addSay(twiml,
        "... You know what? I need to put you on hold. This conversation is exhausting me.",
        { voice: callVoice.voice, rate: '105%', volume: 'soft' }
      );
      twilioService.addPlay(twiml, getRandomHoldMusic());
      twilioService.addSay(twiml,
        "... ... ... I'm back. That was the best 30 seconds of my day. Now, where were we?",
        { voice: callVoice.voice, rate: '105%' }
      );
    }

    const gather = twilioService.createGather(twiml);
    const voiceStyle = voiceService.getVoiceStyle(intent, callVoice.style, conversation.callCount + 1);

    const enhancedResponse = voiceService.enhanceResponse(response, {
      mood: voiceStyle,
      voice: voiceService.normalizeVoiceName(callVoice.voice),
      addBreathing: conversation.callCount > 3
    });

    twilioService.addSay(gather, enhancedResponse.text, {
      voice: callVoice.voice,
      rate: enhancedResponse.rate,
      volume: enhancedResponse.volume
    });

    if (Math.random() > 0.8) {
      twilioService.addPause(gather, 1);
      twilioService.addSay(gather, "... Anything else I can pretend to help you with?", {
        voice: callVoice.voice,
        rate: '105%'
      });
    }
  }

  res.type('text/xml').send(twilioService.toXml(twiml));
});

app.post('/call-status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;

  console.log(`📞 Call ${callSid} status: ${callStatus}`);
  conversationService.setCallStatus(callSid, callStatus);

  const endStatuses = ['completed', 'failed', 'busy', 'no-answer'];
  if (endStatuses.includes(callStatus)) {
    conversationService.cleanupCall(callSid);
  }

  res.sendStatus(200);
});

app.get('/health', (req, res) => {
  const mood = getCurrentMood();
  res.json({
    status: 'unfortunately operational',
    mood: mood.name,
    moodTraits: mood.traits,
    activeConversations: conversationService.getActiveConversationCount(),
    serverUptime: process.uptime(),
    currentTime: new Date().toISOString(),
    sarcasmLevel: 'maximum',
    willToLive: 'depleting',
    message: "Yes, it's working. No, I'm not happy about it."
  });
});

app.post('/test-simple', (req, res) => {
  console.log('Test endpoint hit');
  const twiml = twilioService.createVoiceResponse();
  twilioService.addSay(twiml,
    "... Oh wonderful ... another test call ... This is exactly what I needed today.",
    { voice: 'Polly.Amy-Neural', rate: '95%', volume: 'soft' }
  );
  res.type('text/xml').send(twilioService.toXml(twiml));
});

app.post('/web-call', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  console.log(`🌐 Web call request to: ${phoneNumber}`);

  if (!twilioService.isAvailable()) {
    return res.status(503).json({
      success: false,
      error: 'Twilio is not configured. Web calling is unavailable.'
    });
  }

  try {
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'https://sarcastic-receptionist-backup.loca.lt';
    const call = await twilioService.initiateCall(phoneNumber, webhookBaseUrl);

    console.log(`✅ Call initiated: ${call.sid}`);
    conversationService.setCallStatus(call.sid, 'initiated');

    res.json({ success: true, callSid: call.sid, message: 'Call initiated successfully' });
  } catch (error) {
    console.error('Failed to initiate call:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate call. Please try again.' });
  }
});

app.get('/call-status/:callSid', (req, res) => {
  res.json(conversationService.getCallStatus(req.params.callSid));
});

app.get('/', (req, res) => {
  const mood = getCurrentMood();
  res.send(`
    <html>
      <head>
        <title>Sarcastic Receptionist</title>
        <style>
          body { font-family: Arial, sans-serif; background: #667eea; color: white; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; }
          h1 { text-align: center; }
          .status { background: rgba(0,255,0,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; }
          code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; }
          a { color: #f06292; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🙄 Sarcastic Receptionist</h1>
          <div class="status">
            <strong>Status:</strong> Working<br>
            <strong>Mood:</strong> ${mood.name}<br>
            <strong>Active Calls:</strong> ${conversationService.getActiveConversationCount()}
          </div>
          <h3>Endpoints:</h3>
          <ul>
            <li><code>POST /incoming-call</code> - Twilio webhook</li>
            <li><code>POST /handle-speech</code> - Speech handler</li>
            <li><code>GET /health</code> - Health check</li>
          </ul>
          <p>
            <a href="/index.html">📞 Test Interface</a> |
            <a href="/health">📊 Health Status</a>
          </p>
        </div>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const mood = getCurrentMood();
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   🙄  SARCASTIC RECEPTIONIST v4.0 (Refactored)               ║
║   Port: ${PORT}                                                    ║
║   Mood: ${mood.name.padEnd(49)}║
╚═══════════════════════════════════════════════════════════════╝

📞 Webhook: POST /incoming-call
🧪 Test: POST /test-simple
🌐 Web: http://localhost:${PORT}/
  `);
});
