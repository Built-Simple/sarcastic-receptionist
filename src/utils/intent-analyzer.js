/**
 * Intent Analyzer Utility
 * Analyzes user speech to determine intent
 */

export function analyzeIntent(speech) {
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
