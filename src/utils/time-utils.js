/**
 * Time Utilities
 * Time-based greeting and mood functions
 */

import { dailyMoods, getTimeBasedModifier } from '../../personality-config.js';

export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getCurrentMood() {
  const day = new Date().getDay();
  return dailyMoods[day];
}

export function getCurrentTimeModifier() {
  return getTimeBasedModifier();
}
