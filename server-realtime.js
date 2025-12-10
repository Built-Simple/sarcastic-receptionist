/**
 * Sarcastic Receptionist - Real-time Voice Server
 * Uses Twilio Media Streams + Deepgram for natural voice
 */

import 'dotenv/config';
import express from 'express';
import expressWs from 'express-ws';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  aiService,
  twilioService,
  conversationService,
  loggerService,
  deepgramTTS,
  mediaStreamService
} from './src/services/index.js';
import { getRandomGreeting } from './src/config/greetings.js';
import { getRandomInterruption, shouldInterrupt } from './src/config/interruptions.js';
import { getCurrentMood, getCurrentTimeModifier } from './src/utils/time-utils.js';
import { analyzeIntent } from './src/utils/intent-analyzer.js';
import { getResponseByIntent } from './personality-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
expressWs(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const VOICE_STYLES = {
  'Existential Sunday Dread': 'exhausted',
  'Why-Am-I-Here Monday Blues': 'dramatic',
  'Passive Aggressive Tuesday': 'passive_aggressive',
  'Overly Corporate Wednesday': 'condescending',
  'Dramatic Sighing Thursday': 'exhausted',
  'Completely Checked Out Friday': 'bored',
  'Too Cool for This Saturday': 'condescending'
};

app.post('/incoming-call', async (req, res) => {
  console.log("📞 Incoming call - starting real-time stream");

  const callSid = req.body.CallSid;
  const fromNumber = req.body.From;
  const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || `https://${req.headers.host}`;

  conversationService.createConversation(callSid, fromNumber);

  const mood = getCurrentMood();
  const voiceStyle = VOICE_STYLES[mood.name] || 'sarcastic';
  conversationService.setCallVoice(callSid, voiceStyle, voiceStyle);

  const twiml = twilioService.createVoiceResponse();

  const connect = twiml.connect();
  connect.stream({
    url: `wss://${req.headers.host}/media-stream/${callSid}`,
    track: 'both_tracks'
  });

  console.log(`📞 Call ${callSid} connecting to media stream`);
  res.type('text/xml').send(twilioService.toXml(twiml));
});

app.ws('/media-stream/:callSid', async (ws, req) => {
  const callSid = req.params.callSid;
  console.log(`🔌 WebSocket connected for call ${callSid}`);

  const mood = getCurrentMood();
  const voiceStyle = VOICE_STYLES[mood.name] || 'sarcastic';
  let streamSid = null;
  let hasGreeted = false;
  let transcriptBuffer = '';
  let silenceTimeout = null;

  const conversation = conversationService.getConversation(callSid) || {
    history: [],
    callCount: 0
  };

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.event) {
        case 'connected':
          console.log(`📞 Media stream connected for ${callSid}`);
          break;

        case 'start':
          streamSid = data.start.streamSid;
          console.log(`📞 Media stream started: ${streamSid}`);

          if (!hasGreeted) {
            hasGreeted = true;
            const greeting = getRandomGreeting();

            await loggerService.logInteraction(callSid, '[New Call]', greeting, { mood: mood.name });

            setTimeout(async () => {
              await speakToStream(greeting);
            }, 500);
          }
          break;

        case 'media':
          break;

        case 'stop':
          console.log(`📞 Media stream stopped for ${callSid}`);
          conversationService.cleanupCall(callSid);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket closed for call ${callSid}`);
    if (silenceTimeout) clearTimeout(silenceTimeout);
    conversationService.cleanupCall(callSid);
  });

  ws.on('error', (error) => {
    console.error(`🔌 WebSocket error for ${callSid}:`, error);
  });

  async function speakToStream(text) {
    if (!streamSid || ws.readyState !== 1) {
      console.warn('Cannot speak - stream not ready');
      return;
    }

    try {
      const audioBase64 = await deepgramTTS.synthesizeForTwilio(text, { style: voiceStyle });

      const chunkSize = 8000;
      for (let i = 0; i < audioBase64.length; i += chunkSize) {
        const chunk = audioBase64.slice(i, i + chunkSize);
        ws.send(JSON.stringify({
          event: 'media',
          streamSid: streamSid,
          media: { payload: chunk }
        }));
      }

      ws.send(JSON.stringify({
        event: 'mark',
        streamSid: streamSid,
        mark: { name: 'speech_done' }
      }));

    } catch (error) {
      console.error('TTS error:', error);
    }
  }
});

app.post('/handle-speech', async (req, res) => {
  console.log('🎙️ Handle speech (fallback mode)');
  const twiml = twilioService.createVoiceResponse();
  const speechResult = req.body.SpeechResult || "";
  const callSid = req.body.CallSid;

  console.log(`💬 User said: "${speechResult}"`);

  const conversation = conversationService.getConversation(callSid);
  conversationService.incrementCallCount(callSid);
  const callVoice = conversationService.getCallVoice(callSid);

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
    interactionNumber: conversation.callCount + 1
  });

  if (isFarewell) {
    const farewellTemplate = getResponseByIntent('farewells');

    try {
      const audioBase64 = await deepgramTTS.synthesizeForTwilio(farewellTemplate.text, {
        style: callVoice.style || 'sarcastic'
      });

      twiml.play(`data:audio/x-mulaw;base64,${audioBase64}`);
    } catch (e) {
      twilioService.addSay(twiml, farewellTemplate.text, { voice: 'Polly.Amy-Neural' });
    }

    twilioService.addHangup(twiml);
    conversationService.cleanupCall(callSid);
  } else {
    const gather = twilioService.createGather(twiml);

    try {
      const audioBase64 = await deepgramTTS.synthesizeForTwilio(response, {
        style: callVoice.style || 'sarcastic'
      });

      gather.play(`data:audio/x-mulaw;base64,${audioBase64}`);
    } catch (e) {
      twilioService.addSay(gather, response, { voice: 'Polly.Amy-Neural' });
    }
  }

  res.type('text/xml').send(twilioService.toXml(twiml));
});

app.post('/call-status', (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;

  console.log(`📞 Call ${callSid} status: ${callStatus}`);
  conversationService.setCallStatus(callSid, callStatus);

  if (['completed', 'failed', 'busy', 'no-answer'].includes(callStatus)) {
    conversationService.cleanupCall(callSid);
  }

  res.sendStatus(200);
});

app.get('/health', (req, res) => {
  const mood = getCurrentMood();
  res.json({
    status: 'unfortunately operational',
    mode: 'real-time voice (Deepgram Aura)',
    mood: mood.name,
    moodTraits: mood.traits,
    activeConversations: conversationService.getActiveConversationCount(),
    activeStreams: mediaStreamService.getActiveStreamCount(),
    serverUptime: process.uptime(),
    currentTime: new Date().toISOString(),
    sarcasmLevel: 'maximum',
    willToLive: 'depleting',
    deepgramTTS: deepgramTTS.isAvailable ? 'connected' : 'unavailable',
    message: "Yes, it's working. No, I'm not happy about it."
  });
});

app.get('/', (req, res) => {
  const mood = getCurrentMood();
  res.send(`
    <html>
      <head>
        <title>Sarcastic Receptionist (Real-time Voice)</title>
        <style>
          body { font-family: Arial, sans-serif; background: #667eea; color: white; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 10px; }
          h1 { text-align: center; }
          .status { background: rgba(0,255,0,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; }
          .feature { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 5px 0; }
          code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; }
          a { color: #f06292; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🙄 Sarcastic Receptionist</h1>
          <h2>✨ Real-time Voice Edition</h2>
          <div class="status">
            <strong>Status:</strong> Working with Deepgram Aura TTS<br>
            <strong>Mood:</strong> ${mood.name}<br>
            <strong>Voice Engine:</strong> Deepgram Aura-2 (Natural)<br>
            <strong>Active Calls:</strong> ${conversationService.getActiveConversationCount()}
          </div>

          <h3>🎙️ Voice Features:</h3>
          <div class="feature">✅ Real-time streaming TTS (no robot voice!)</div>
          <div class="feature">✅ Deepgram Aura-2 natural voices</div>
          <div class="feature">✅ Low latency (~200ms)</div>
          <div class="feature">✅ Mood-based voice styles</div>

          <h3>Endpoints:</h3>
          <ul>
            <li><code>POST /incoming-call</code> - Twilio webhook (starts media stream)</li>
            <li><code>WS /media-stream/:callSid</code> - Real-time audio WebSocket</li>
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
║   🙄  SARCASTIC RECEPTIONIST v5.0 (Real-time Voice)          ║
║   Port: ${PORT}                                                    ║
║   Voice: Deepgram Aura-2 (Natural TTS)                        ║
║   Mood: ${mood.name.padEnd(49)}║
╚═══════════════════════════════════════════════════════════════╝

📞 Webhook: POST /incoming-call
🔌 WebSocket: /media-stream/:callSid
🌐 Web: http://localhost:${PORT}/
🎙️ TTS: ${deepgramTTS.isAvailable ? '✅ Deepgram Aura connected' : '❌ Deepgram not configured'}
  `);
});
