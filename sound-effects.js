// Sound effects module for sarcastic receptionist

export const soundEffectUrls = {
  holdMusic: [
    'https://example.com/hold-music-1.mp3',
    'https://example.com/hold-music-2.mp3',
    'https://example.com/hold-music-3.mp3'
  ],
  dialTone: 'https://example.com/dial-tone.mp3',
  busySignal: 'https://example.com/busy-signal.mp3',
  ringTone: 'https://example.com/ring-tone.mp3'
};

export function getRandomHoldMusic() {
  const musicOptions = soundEffectUrls.holdMusic;
  return musicOptions[Math.floor(Math.random() * musicOptions.length)];
}

export default soundEffectUrls;
