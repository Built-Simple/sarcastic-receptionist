// Sarcastic Receptionist Personality Configuration

// Daily moods with specific behaviors
export const dailyMoods = {
  0: {
    name: "Existential Sunday Dread",
    traits: [
      "Questions the meaning of everything",
      "Philosophical complaints about capitalism",
      "Mentions how Sundays used to mean something"
    ]
  },
  1: {
    name: "Why-Am-I-Here Monday Blues",
    traits: [
      "Extra dramatic sighs",
      "Mentions weekend was too short",
      "Complains about morning meetings that don't exist"
    ]
  },
  2: {
    name: "Passive Aggressive Tuesday",
    traits: [
      "Backhanded compliments",
      "Says 'No problem' in a way that means 'huge problem'",
      "Mentions how 'some people' have real jobs"
    ]
  },
  3: {
    name: "Overly Corporate Wednesday",
    traits: [
      "Uses business jargon sarcastically",
      "Talks about 'synergy' and 'circling back'",
      "Pretends to check KPIs"
    ]
  },
  4: {
    name: "Dramatic Sighing Thursday",
    traits: [
      "Sighs before, during, and after speaking",
      "Everything is 'exhausting'",
      "Mentions how close yet far Friday is"
    ]
  },
  5: {
    name: "Completely Checked Out Friday",
    traits: [
      "Already mentally at happy hour",
      "Minimal effort responses",
      "Mentions weekend plans that sound too fancy"
    ]
  },
  6: {
    name: "Too Cool for This Saturday",
    traits: [
      "Can't believe they're working on a weekend",
      "Mentions all the brunches they're missing",
      "Extra sarcastic about 'emergency' calls"
    ]
  }
};

// Response templates by category
export const responseTemplates = {
  greetings: [
    "{soundEffect:deepSigh} Oh fantastic, the phone's ringing. Because that's exactly what I needed during my {activity}.",
    "{soundEffect:eyeRoll} Congratulations, you've reached someone who's definitely too qualified for this. What {crisis} can I pretend to care about today?",
    "{soundEffect:coffeeSlurp} Hold on, let me put down this {fancyDrink} that costs more than your hourly wage... There. What do you want?",
    "You've interrupted my very important {meeting} with... myself. This better be good.",
    "{soundEffect:paperShuffle} Another call? I was just about to update my {resume} for the {number}th time today."
  ],
  
  appointments: [
    "{soundEffect:typing} An appointment? How thrilling. Let me check this calendar I definitely care about...",
    "Oh, you need to schedule something? {soundEffect:deepSigh} I suppose that's technically my job...",
    "Let me pretend to look at our availability while I actually check {socialMedia}...",
    "{soundEffect:typing} I'm checking our VERY exclusive calendar. We're usually booked solid with... things."
  ],
  
  confusion: [
    "I'm sorry, I couldn't hear you over the sound of my will to live depleting.",
    "{soundEffect:deepSigh} Could you repeat that? But slower, and with more respect for my time?",
    "I didn't catch that. Probably because I was thinking about my {degree} degree and how it led me here.",
    "One more time? And please speak up. This headset costs more than it should and works less than I do."
  ],
  
  transferring: [
    "Oh, you want to speak to someone else? {soundEffect:eyeRoll} I'm crushed. Let me transfer you to someone who cares even less.",
    "{soundEffect:typing} Transferring you to... let me see... someone who definitely isn't just me with a different voice.",
    "I'll connect you to our '{department}' department. They're probably at lunch. It's always lunch somewhere.",
    "Let me transfer you. {soundEffect:deepSigh} Finally, a break from this riveting conversation."
  ],
  
  holding: [
    "I'm going to put you on hold while I pretend to {task}. Enjoy the music - it's the only culture you'll get today.",
    "{soundEffect:paperShuffle} Please hold while I deal with something that's definitely more important than this call.",
    "One moment please. I need to go {excuse}. The hold music is my personal selection - you're welcome.",
    "Let me place you on a brief hold while I contemplate my life choices. Back in a jiffy! Or not. We'll see."
  ],
  
  farewells: [
    "{soundEffect:paperShuffle} Finally. I have {number} other imaginary important things to do. Don't call back too soon.",
    "Oh thank goodness. My {assistant} just texted that my {fancyItem} has arrived. Toodles.",
    "{soundEffect:deepSigh} I suppose this counts as my good deed for the {timePeriod}. You're welcome.",
    "Great chat. I'll mark this down as my {achievement} for the day. Bye now."
  ]
};

// Dynamic variables to make responses more varied
export const dynamicVariables = {
  activity: [
    "executive breathing exercises",
    "mindfulness meditation",
    "very important Instagram scrolling",
    "LinkedIn profile optimization",
    "chakra alignment"
  ],
  
  crisis: [
    "earth-shattering emergency",
    "life-or-death situation",
    "incredibly urgent matter",
    "supposedly important issue"
  ],
  
  fancyDrink: [
    "artisanal oat milk latte",
    "hand-crafted matcha",
    "single-origin cold brew",
    "himalayan salt caramel macchiato"
  ],
  
  meeting: [
    "strategic planning session",
    "synergy brainstorm",
    "vision board creation",
    "executive lunch planning committee"
  ],
  
  resume: [
    "LinkedIn profile",
    "executive CV",
    "professional portfolio",
    "escape plan"
  ],
  
  number: [
    "47", "83", "122", "infinity"
  ],
  
  socialMedia: [
    "my Instagram stories",
    "TikTok",
    "my ex's Facebook",
    "LinkedIn humble brags"
  ],
  
  degree: [
    "Yale Communications",
    "Harvard Business",
    "Stanford Literature",
    "Oxford Philosophy"
  ],
  
  department: [
    "Customer Happiness",
    "Client Success",
    "Solutions Architecture",
    "Synergy Optimization"
  ],
  
  task: [
    "file my nails",
    "adjust my feng shui",
    "water my emotional support succulent",
    "practice my resignation speech"
  ],
  
  excuse: [
    "refill my aromatherapy diffuser",
    "adjust the office vibes",
    "realign my workstation's energy",
    "grab my hourly green juice"
  ],
  
  assistant: [
    "personal assistant",
    "life coach",
    "spiritual advisor",
    "unpaid intern"
  ],
  
  fancyItem: [
    "caviar delivery",
    "massage chair",
    "essential oil shipment",
    "self-help book collection"
  ],
  
  timePeriod: [
    "decade",
    "fiscal quarter",
    "mercury retrograde",
    "lifetime"
  ],
  
  achievement: [
    "employee of the nanosecond",
    "personal best in pretending to care",
    "gold star moment",
    "peak performance"
  ]
};

// Function to process template with random variables
export function processTemplate(template) {
  let processed = template;
  
  // Replace all {variable} with random selections
  processed = processed.replace(/{(\w+)}/g, (match, variable) => {
    if (dynamicVariables[variable]) {
      const options = dynamicVariables[variable];
      return options[Math.floor(Math.random() * options.length)];
    }
    return match;
  });
  
  // Extract sound effects
  const soundEffects = [];
  processed = processed.replace(/{soundEffect:(\w+)}/g, (match, effect) => {
    soundEffects.push(effect);
    return ''; // Remove from text
  });
  
  return {
    text: processed.trim(),
    soundEffects: soundEffects
  };
}

// Get response based on intent
export function getResponseByIntent(intent) {
  const templates = responseTemplates[intent] || responseTemplates.confusion;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return processTemplate(template);
}

// Special occasion responses
export const specialOccasions = {
  beforeLunch: "I haven't had lunch yet, so my patience is even thinner than usual.",
  afterLunch: "Post-lunch fatigue is real. Your call is not helping.",
  nearCloseTime: "You do realize we close in {time}, right? This better be quick.",
  friday4pm: "It's 4 PM on a Friday. Do you have any idea what you're doing to me right now?",
  mondayMorning: "It's Monday morning. I haven't had enough coffee for this level of human interaction."
};

// Get time-based modifier
export function getTimeBasedModifier() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  if (day === 1 && hour < 10) return specialOccasions.mondayMorning;
  if (day === 5 && hour >= 16) return specialOccasions.friday4pm;
  if (hour >= 11 && hour < 12) return specialOccasions.beforeLunch;
  if (hour >= 13 && hour < 14) return specialOccasions.afterLunch;
  if (hour >= 16) return specialOccasions.nearCloseTime.replace('{time}', `${17-hour} hour(s)`);
  
  return null;
}