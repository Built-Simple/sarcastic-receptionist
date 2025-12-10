/**
 * Deepgram TTS Service - Real-time Text-to-Speech via WebSocket
 * Uses Deepgram Aura for natural-sounding voice synthesis
 */

import { createClient, LiveTTSEvents } from '@deepgram/sdk';

const VOICE_MAP = {
  british_female: 'aura-2-thalia-en',
  british_male: 'aura-2-orion-en',
  american_female: 'aura-2-luna-en',
  american_male: 'aura-2-zeus-en',
  australian_female: 'aura-2-stella-en',
  sarcastic: 'aura-2-athena-en',
  condescending: 'aura-2-thalia-en',
  bored: 'aura-2-luna-en',
  exhausted: 'aura-2-hera-en',
  dramatic: 'aura-2-athena-en',
  passive_aggressive: 'aura-2-stella-en'
};

class DeepgramTTSService {
  constructor() {
    this.client = null;
    this.isAvailable = false;
    this._init();
  }

  _init() {
    if (process.env.DEEPGRAM_API_KEY) {
      try {
        this.client = createClient(process.env.DEEPGRAM_API_KEY);
        this.isAvailable = true;
        console.log('✅ Deepgram TTS client initialized');
      } catch (error) {
        console.warn('⚠️ Failed to initialize Deepgram TTS:', error.message);
      }
    } else {
      console.log('ℹ️ Deepgram TTS not configured (missing DEEPGRAM_API_KEY)');
    }
  }

  getVoiceForStyle(style) {
    return VOICE_MAP[style] || VOICE_MAP.sarcastic;
  }

  async synthesizeToBuffer(text, options = {}) {
    if (!this.isAvailable) {
      throw new Error('Deepgram TTS not available');
    }

    const voice = options.voice || this.getVoiceForStyle(options.style || 'sarcastic');

    const response = await this.client.speak.request(
      { text },
      {
        model: voice,
        encoding: 'mulaw',
        sample_rate: 8000,
        container: 'none'
      }
    );

    const stream = await response.getStream();
    const chunks = [];

    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  async synthesizeForTwilio(text, options = {}) {
    const audioBuffer = await this.synthesizeToBuffer(text, options);
    return audioBuffer.toString('base64');
  }

  createLiveConnection(options = {}) {
    if (!this.isAvailable) {
      throw new Error('Deepgram TTS not available');
    }

    const voice = options.voice || this.getVoiceForStyle(options.style || 'sarcastic');

    const connection = this.client.speak.live({
      model: voice,
      encoding: 'mulaw',
      sample_rate: 8000,
      container: 'none'
    });

    return connection;
  }

  async streamToTwilio(text, twilioWs, streamSid, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const connection = this.createLiveConnection(options);
        const audioChunks = [];

        connection.on(LiveTTSEvents.Open, () => {
          console.log('🎙️ Deepgram TTS connection opened');
          connection.sendText(text);
          connection.flush();
        });

        connection.on(LiveTTSEvents.Audio, (data) => {
          const base64Audio = Buffer.from(data).toString('base64');

          if (twilioWs && twilioWs.readyState === 1) {
            twilioWs.send(JSON.stringify({
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: base64Audio
              }
            }));
          }

          audioChunks.push(data);
        });

        connection.on(LiveTTSEvents.Flushed, () => {
          console.log('🎙️ Deepgram TTS flushed');
        });

        connection.on(LiveTTSEvents.Close, () => {
          console.log('🎙️ Deepgram TTS connection closed');
          resolve(Buffer.concat(audioChunks));
        });

        connection.on(LiveTTSEvents.Error, (error) => {
          console.error('🎙️ Deepgram TTS error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new DeepgramTTSService();
