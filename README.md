# Sarcastic Receptionist - Voice Assistant

A sophisticated AI-powered voice receptionist with a sarcastic personality. Built with Express.js, OpenAI GPT, Deepgram speech recognition, and Twilio phone integration.

## Features

- **AI-Powered Conversations:** OpenAI GPT with custom sarcastic personality
- **Voice Recognition:** Real-time speech-to-text via Deepgram
- **Text-to-Speech:** Natural voice responses with PlayHT
- **Phone Integration:** Twilio for incoming/outgoing calls
- **Daily Moods:** 7 different personality moods (one per day of week)
- **Web Interface:** Modern dark-themed UI with WebSocket support
- **Knowledge Base:** Restaurant/business information integration

## Deployments

### Production Instances

1. **Sarcastic Receptionist (Generic)**
   - URL: https://receptionist.built-simple.ai/
   - Container: CT 114 on Victini
   - IP: 192.168.1.161:3000
   - Phone: +1 (725) 726-3727

2. **Peinto Thai Kitchen Receptionist**
   - URL: https://peintothai.built-simple.ai/
   - Container: CT 116 on Victini  
   - IP: 192.168.1.21:3000
   - Phone: +1 (725) 726-3727
   - Configured for restaurant-specific queries

## Technology Stack

- **Backend:** Express.js 5.1.0
- **AI:** OpenAI GPT API
- **Speech Recognition:** Deepgram SDK
- **Text-to-Speech:** PlayHT
- **Phone Service:** Twilio
- **WebSockets:** express-ws, ws
- **Runtime:** Node.js 20+

## Installation

\`\`\`bash
# Clone repository
git clone <repository-url>
cd sarcastic-receptionist-repo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start server
npm start

# Or start in production mode
npm run start:production
\`\`\`

## Environment Variables

\`\`\`
OPENAI_API_KEY=           # OpenAI API key
TWILIO_ACCOUNT_SID=       # Twilio account SID
TWILIO_AUTH_TOKEN=        # Twilio auth token
TWILIO_PHONE_NUMBER=      # Your Twilio phone number
DEEPGRAM_API_KEY=         # Deepgram API key (optional)
PLAYHT_API_KEY=           # PlayHT API key (optional)
PLAYHT_USER_ID=           # PlayHT user ID (optional)
PORT=3000                 # Server port
WEBHOOK_BASE_URL=         # Public URL for webhooks
SKIP_TWILIO=false         # Set to true to disable Twilio
\`\`\`

## Project Structure

\`\`\`
.
├── ultimate-sarcastic-server-fixed.js  # Main server
├── personality-config.js                # Mood & response templates
├── voice-enhancement-fixed.js           # Voice processing
├── sound-effects.js                     # Audio effects
├── knowledge-base.js                    # Knowledge system
├── active-knowledge-base.json           # Business information
├── public/                              # Web UI
│   ├── index.html                       # Main interface
│   ├── embed-demo.html                  # Embeddable widget demo
│   └── widget.js                        # Widget code
├── package.json
└── README.md
\`\`\`

## Usage

### Web Interface

Visit the deployed URL to access the web interface. Click the large call button to start a voice conversation.

### Phone Calls

Call the configured Twilio number to speak with the receptionist.

### API Endpoints

- `GET /` - Web interface
- `GET /health` - Health check
- `POST /voice` - Twilio voice webhook
- `WebSocket /ws` - Real-time voice streaming

## Development

\`\`\`bash
# Start with auto-reload
npm run dev

# Run health check
npm run health-check

# View funny interactions
npm run logs:funny

# View today's logs
npm run logs:today
\`\`\`

## Personality System

The receptionist has 7 daily moods:
- **Sunday:** Existential Dread
- **Monday:** Why-Am-I-Here Blues
- **Tuesday:** Passive Aggressive
- **Wednesday:** Overly Corporate
- **Thursday:** Dramatic Sighing
- **Friday:** Completely Checked Out
- **Saturday:** Too Cool for This

## Deployment

See [README-DEPLOYMENT.md](README-DEPLOYMENT.md) for detailed deployment instructions.

## License

ISC

## Support

For issues or questions, contact the repository maintainer.
