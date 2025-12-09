// Fixed Voice Enhancement Module for Twilio
// Uses Twilio's built-in attributes instead of inline SSML

export const voiceProfiles = {
  // British voices for maximum condescension
  amy: {
    voice: 'Polly.Amy-Neural',
    accent: 'British',
    description: 'Posh British accent, perfect for condescending remarks'
  },
  brian: {
    voice: 'Polly.Brian-Neural',
    accent: 'British', 
    description: 'British male, very proper and dismissive'
  },
  
  // American voices for variety
  joanna: {
    voice: 'Polly.Joanna-Neural',
    accent: 'American',
    description: 'Natural conversational American female'
  },
  matthew: {
    voice: 'Polly.Matthew-Neural',
    accent: 'American',
    description: 'American male, good for announcements'
  },
  ruth: {
    voice: 'Polly.Ruth-Neural',
    accent: 'American',
    description: 'Professional American female'
  },
  kendra: {
    voice: 'Polly.Kendra-Neural',
    accent: 'American',
    description: 'Neutral American female'
  },
  
  // Australian for extra sass
  olivia: {
    voice: 'Polly.Olivia-Neural',
    accent: 'Australian',
    description: 'Australian female, naturally sarcastic'
  }
};

// Enhanced voice response generator for Twilio
export function enhanceVoiceResponse(text, options = {}) {
  const {
    mood = 'sarcastic',
    voice = 'amy', // Default to British Amy for maximum condescension
    addBreathing = true
  } = options;

  // Process text - remove sound effect markers and replace with pauses
  let processedText = text;
  
  // First, handle *emphasis* markers that AREN'T sound effects
  // Save sound effects for special handling
  const soundEffects = [
    'DEEP SIGH', 'SIGH', 'DRAMATIC SIGH', 'EYE ROLL', 
    'PAUSE', 'TYPING', 'PAPER SHUFFLE', 'COFFEE SLURP', 
    'DRAMATIC PAUSE'
  ];
  
  // Replace sound effect descriptions with pauses or remove them
  processedText = processedText
    .replace(/\*DEEP SIGH\*/gi, '... ... ...')
    .replace(/\*SIGH\*/gi, '...')
    .replace(/\*DRAMATIC SIGH\*/gi, '... ... ... ...')
    .replace(/\*EYE ROLL\*/gi, '')  // Can't hear an eye roll - just remove it
    .replace(/\*PAUSE\*/gi, '...')
    .replace(/\*TYPING\*/gi, '... ...')
    .replace(/\*PAPER SHUFFLE\*/gi, '...')
    .replace(/\*COFFEE SLURP\*/gi, '...')
    .replace(/\*DRAMATIC PAUSE\*/gi, '... ... ...');
  
  // Now remove any remaining *emphasis* markers (but not sound effects we already handled)
  processedText = processedText.replace(/\*([^*]+)\*/g, (match, content) => {
    // If it's not a sound effect, just return the content without asterisks
    if (!soundEffects.some(effect => content.toUpperCase().includes(effect))) {
      return content;
    }
    return match; // This shouldn't happen as we already handled sound effects
  });
  
  // Clean up any multiple spaces or extra dots
  processedText = processedText.replace(/\s+/g, ' ').trim();
  processedText = processedText.replace(/\.{4,}/g, '...'); // Limit consecutive dots
  
  // Add initial pause if requested
  if (addBreathing) {
    processedText = '... ' + processedText;
  }

  // Voice style configurations with Twilio attributes
  const voiceStyles = {
    sarcastic: {
      voice: voiceProfiles[voice].voice,
      rate: '115%',
      volume: 'medium',
      text: processedText
    },
    
    condescending: {
      voice: voiceProfiles.amy.voice, // Always use British Amy for this
      rate: '115%',
      volume: 'soft',
      text: processedText
    },
    
    dramatic: {
      voice: voiceProfiles.ruth.voice,
      rate: '115%',
      volume: 'medium',
      text: '... ' + processedText
    },
    
    bored: {
      voice: voiceProfiles.kendra.voice,
      rate: '115%',
      volume: 'soft',
      text: processedText
    },
    
    passive_aggressive: {
      voice: voiceProfiles.olivia.voice,
      rate: '115%',
      volume: 'medium',
      text: processedText.replace(/\./g, '...')
    },
    
    overly_cheerful: {
      voice: voiceProfiles.joanna.voice,
      rate: '115%',
      volume: 'loud',
      text: processedText
    },
    
    exhausted: {
      voice: voiceProfiles[voice].voice,
      rate: '115%',
      volume: 'soft',
      text: '... ... ' + processedText + ' ...'
    }
  };

  return voiceStyles[mood] || voiceStyles.sarcastic;
}

// Get voice based on day of week mood
export function getVoiceForMood(dayMood) {
  const moodVoiceMap = {
    'Existential Sunday Dread': { voice: 'brian', style: 'exhausted' },
    'Why-Am-I-Here Monday Blues': { voice: 'amy', style: 'dramatic' },
    'Passive Aggressive Tuesday': { voice: 'olivia', style: 'passive_aggressive' },
    'Overly Corporate Wednesday': { voice: 'ruth', style: 'condescending' },
    'Dramatic Sighing Thursday': { voice: 'amy', style: 'exhausted' },
    'Completely Checked Out Friday': { voice: 'kendra', style: 'bored' },
    'Too Cool for This Saturday': { voice: 'amy', style: 'condescending' }
  };
  
  return moodVoiceMap[dayMood] || { voice: 'amy', style: 'sarcastic' };
}

// Simple templates without SSML
export const ssmlTemplates = {
  greeting: (text) => text,
  thinking: (text) => 'Hmm... ' + text,
  annoyed: (text) => '... ' + text,
  fake_helpful: (text) => text,
  goodbye: (text) => text + '... ... Finally...'
};