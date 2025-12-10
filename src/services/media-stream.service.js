/**
 * Media Stream Service - Handles Twilio Media Streams WebSocket
 * Bridges Twilio audio with Deepgram STT and TTS
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import deepgramTTS from './deepgram-tts.service.js';

class MediaStreamService {
  constructor() {
    this.activeStreams = new Map();
    this.deepgramClient = null;
    this._init();
  }

  _init() {
    if (process.env.DEEPGRAM_API_KEY) {
      this.deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
      console.log('✅ MediaStream service initialized with Deepgram');
    }
  }

  createStreamHandler(callSid, options = {}) {
    const streamState = {
      callSid,
      streamSid: null,
      twilioWs: null,
      deepgramLive: null,
      voiceStyle: options.voiceStyle || 'sarcastic',
      onTranscript: options.onTranscript || (() => {}),
      onResponse: options.onResponse || (() => {}),
      buffer: [],
      isProcessing: false
    };

    this.activeStreams.set(callSid, streamState);
    return streamState;
  }

  async handleTwilioMessage(callSid, message, ws) {
    const streamState = this.activeStreams.get(callSid);
    if (!streamState) return;

    const data = JSON.parse(message);

    switch (data.event) {
      case 'connected':
        console.log(`📞 Twilio stream connected for call ${callSid}`);
        break;

      case 'start':
        streamState.streamSid = data.start.streamSid;
        streamState.twilioWs = ws;
        console.log(`📞 Twilio stream started: ${streamState.streamSid}`);
        await this._startDeepgramSTT(streamState);
        break;

      case 'media':
        if (streamState.deepgramLive) {
          const audio = Buffer.from(data.media.payload, 'base64');
          streamState.deepgramLive.send(audio);
        }
        break;

      case 'stop':
        console.log(`📞 Twilio stream stopped for call ${callSid}`);
        this._cleanup(callSid);
        break;
    }
  }

  async _startDeepgramSTT(streamState) {
    if (!this.deepgramClient) return;

    streamState.deepgramLive = this.deepgramClient.listen.live({
      model: 'nova-2',
      language: 'en-US',
      smart_format: true,
      encoding: 'mulaw',
      sample_rate: 8000,
      channels: 1,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300
    });

    streamState.deepgramLive.on(LiveTranscriptionEvents.Open, () => {
      console.log('🎤 Deepgram STT connection opened');
    });

    streamState.deepgramLive.on(LiveTranscriptionEvents.Transcript, async (data) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript;

      if (transcript && data.is_final) {
        console.log(`🎤 Final transcript: "${transcript}"`);
        streamState.onTranscript(transcript);
      }
    });

    streamState.deepgramLive.on(LiveTranscriptionEvents.UtteranceEnd, async () => {
      console.log('🎤 Utterance ended');
    });

    streamState.deepgramLive.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('🎤 Deepgram STT error:', error);
    });

    streamState.deepgramLive.on(LiveTranscriptionEvents.Close, () => {
      console.log('🎤 Deepgram STT connection closed');
    });
  }

  async speakToStream(callSid, text, options = {}) {
    const streamState = this.activeStreams.get(callSid);
    if (!streamState || !streamState.twilioWs || !streamState.streamSid) {
      console.warn(`Cannot speak to stream ${callSid} - not connected`);
      return;
    }

    try {
      await deepgramTTS.streamToTwilio(
        text,
        streamState.twilioWs,
        streamState.streamSid,
        { style: options.style || streamState.voiceStyle }
      );
    } catch (error) {
      console.error('Error speaking to stream:', error);
    }
  }

  async sendMark(callSid, markName) {
    const streamState = this.activeStreams.get(callSid);
    if (!streamState?.twilioWs || !streamState?.streamSid) return;

    streamState.twilioWs.send(JSON.stringify({
      event: 'mark',
      streamSid: streamState.streamSid,
      mark: { name: markName }
    }));
  }

  async clearAudio(callSid) {
    const streamState = this.activeStreams.get(callSid);
    if (!streamState?.twilioWs || !streamState?.streamSid) return;

    streamState.twilioWs.send(JSON.stringify({
      event: 'clear',
      streamSid: streamState.streamSid
    }));
  }

  _cleanup(callSid) {
    const streamState = this.activeStreams.get(callSid);
    if (streamState) {
      if (streamState.deepgramLive) {
        streamState.deepgramLive.finish();
      }
      this.activeStreams.delete(callSid);
    }
  }

  getActiveStreamCount() {
    return this.activeStreams.size;
  }
}

export default new MediaStreamService();
