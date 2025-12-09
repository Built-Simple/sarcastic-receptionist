/**
 * Voice Service - Voice Selection & Enhancement
 * Handles voice configuration for calls
 */

import { getVoiceForMood, voiceProfiles, enhanceVoiceResponse } from '../../voice-enhancement-fixed.js';

class VoiceService {
  getVoiceForMood(moodName) {
    return getVoiceForMood(moodName);
  }

  getVoiceProfile(voiceName) {
    return voiceProfiles[voiceName];
  }

  selectVoiceForCall(mood) {
    const voiceConfig = this.getVoiceForMood(mood.name);
    const profile = this.getVoiceProfile(voiceConfig.voice);
    return {
      voice: profile.voice,
      style: voiceConfig.style
    };
  }

  enhanceResponse(text, options = {}) {
    return enhanceVoiceResponse(text, options);
  }

  getVoiceStyle(intent, currentStyle, callCount) {
    if (intent === 'appointments') return 'bored';
    if (intent === 'transferring') return 'passive_aggressive';
    if (callCount > 5) return 'exhausted';
    return currentStyle;
  }

  normalizeVoiceName(voice) {
    return voice.replace('Polly.', '').replace('-Neural', '').toLowerCase();
  }
}

export default new VoiceService();
