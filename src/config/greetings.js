/**
 * Greetings Configuration
 * Sarcastic greetings array for incoming calls
 */

import { getTimeGreeting } from '../utils/time-utils.js';

export function getSarcasticGreetings() {
  const timeGreeting = getTimeGreeting();

  return [
    `${timeGreeting}, thank you for calling... uh... this place. I'm your exceptionally motivated receptionist. How may I direct your call into the void?`,
    `Hello, you've reached the front desk of... somewhere important, I'm sure. This is your dedicated receptionist speaking. What crisis can I help you with today?`,
    `${timeGreeting}, thank you for calling. I'm your receptionist, currently questioning all my life choices. How may I assist you?`,
    `Welcome to our establishment. I'm the receptionist, and yes, I'm a real person, unfortunately. How can I help you today?`,
    `Hello, you've reached the reception desk. I'm here, against my better judgment. What do you need?`,
    `Thank you for calling. This is reception, where enthusiasm comes to die. How may I direct your call?`,
    `${timeGreeting}, you've reached... whatever this company is called. I'm your receptionist, tragically. How can I pretend to help you?`,
    `Hello, front desk speaking. I'm your Yale-educated receptionist, making excellent use of my degree. What can I do for you?`,
    `Thank you for calling our prestigious establishment. I'm the receptionist, living the dream... the nightmare, actually. How may I assist?`,
    `Reception desk, this is your overqualified assistant speaking. I was just updating my resume, but I suppose I can help. What do you need?`
  ];
}

export function getRandomGreeting() {
  const greetings = getSarcasticGreetings();
  return greetings[Math.floor(Math.random() * greetings.length)];
}
