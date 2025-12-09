/**
 * Twilio Service - TwiML Generation & Client Management
 * Handles all Twilio-related functionality
 */

import twilio from 'twilio';

class TwilioService {
  constructor() {
    this.client = null;
    this.skipTwilio = process.env.SKIP_TWILIO === 'true';
    this._initClient();
  }

  _initClient() {
    if (!this.skipTwilio &&
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      try {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio client initialized successfully');
      } catch (error) {
        console.warn('⚠️  Failed to initialize Twilio client:', error.message);
      }
    } else {
      console.log('ℹ️  Running without Twilio (SKIP_TWILIO=true or invalid credentials)');
    }
  }

  isAvailable() {
    return this.client !== null;
  }

  createVoiceResponse() {
    return new twilio.twiml.VoiceResponse();
  }

  createGather(twiml, options = {}) {
    const defaultOptions = {
      input: 'speech',
      speechTimeout: 'auto',
      action: '/handle-speech',
      method: 'POST',
      language: 'en-US',
      speechModel: 'phone_call',
      enhanced: true,
      profanityFilter: false
    };
    return twiml.gather({ ...defaultOptions, ...options });
  }

  addSay(element, text, voiceConfig = {}) {
    const defaults = {
      voice: 'Polly.Amy-Neural',
      rate: '105%',
      volume: 'medium'
    };
    element.say({ ...defaults, ...voiceConfig }, text);
  }

  addPause(element, length = 1) {
    element.pause({ length });
  }

  addPlay(twiml, url, loop = 1) {
    twiml.play({ loop }, url);
  }

  addHangup(twiml) {
    twiml.hangup();
  }

  async initiateCall(phoneNumber, webhookBaseUrl) {
    if (!this.client) {
      throw new Error('Twilio client not available');
    }

    const call = await this.client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      url: `${webhookBaseUrl}/incoming-call`,
      statusCallback: `${webhookBaseUrl}/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST'
    });

    return call;
  }

  toXml(twiml) {
    return twiml.toString();
  }
}

export default new TwilioService();
