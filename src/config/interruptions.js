/**
 * Interruptions Configuration
 * Mid-conversation sarcastic interruption phrases
 */

export const interruptions = [
  "... Actually, hold that thought. My assistant just brought me my hourly kombucha.",
  "... Oh wait, I just remembered I have a very important... thing. But continue.",
  "Sorry, I was just checking my stock portfolio. What were you saying?",
  "One second, I need to update my Instagram story about how hard I'm working..."
];

export function getRandomInterruption() {
  return interruptions[Math.floor(Math.random() * interruptions.length)];
}

export function shouldInterrupt(callCount, probability = 0.15) {
  return Math.random() > (1 - probability) && callCount > 2;
}
