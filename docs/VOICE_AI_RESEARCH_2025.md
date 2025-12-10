# Voice AI Tech Stack Research (January 2025)

Research conducted for natural-sounding AI voice in telephony applications (Twilio integration).

## Summary Table - Top 5 Voice AI Providers for Telephony

| Provider | Voice Quality | Latency | Twilio Integration | Pricing | Voice Cloning | Best For |
|----------|---------------|---------|-------------------|---------|---------------|-----------|
| **Cartesia Sonic** | ⭐⭐⭐⭐⭐ Excellent | 🟢 40-90ms TTFB | ✅ Native WebSocket | $0.030/1K chars | ✅ Yes | Low-latency telephony |
| **ElevenLabs Turbo v2.5** | ⭐⭐⭐⭐⭐ Excellent | 🟢 75ms Flash, 100ms Turbo | ✅ ConversationRelay | $0.18-0.30/1K chars | ✅ 1000+ voices | Best overall quality |
| **Deepgram Aura-2** | ⭐⭐⭐⭐ Very Good | 🟢 <200ms TTFB | ✅ WebSocket streaming | $0.030/1K chars | ⚠️ Limited | Enterprise reliability |
| **PlayHT PlayDialog** | ⭐⭐⭐⭐⭐ Excellent | 🟡 180ms average | ✅ Documented guides | $0.40-0.80/1K chars | ✅ Advanced ASC | Conversational AI |
| **OpenAI Realtime** | ⭐⭐⭐⭐ Very Good | 🟡 ~500ms end-to-end | ✅ Official tutorial | $20/hour conversation | ❌ No custom | Simplicity |

## Recommendations

### 🏆 Best Overall Quality
**ElevenLabs Turbo v2.5** - Best balance of human-like naturalness with 32 language support and extensive voice library. Flash v2.5 model provides 75ms latency.

### 🚀 Best for Low Latency Telephony
**Cartesia Sonic** - Industry-leading 40-90ms TTFB latency with production-proven reliability. Powers millions of calls for Fortune 500 companies.

### 💰 Best Value (Quality vs Price)
**Deepgram Aura-2** - At $0.030/1K characters, significantly undercuts competitors while delivering enterprise-grade quality under 200ms latency.

## Gotchas & Issues by Provider

### ElevenLabs
- **Cost Scaling**: Expensive at high volume ($0.18-0.30/1K chars)
- **Telephony Quality**: Flash v2.5 disables normalization for low latency, may struggle with phone numbers
- **Rate Limits**: Turbo v2.5 has more restrictive rate limits than Flash

### Cartesia Sonic
- **Language Support**: Only 15 native languages (vs 32 for ElevenLabs)
- **Voice Selection**: Smaller voice library compared to ElevenLabs' 1000+ options

### Deepgram Aura-2
- **Voice Cloning**: Limited custom voice options
- **Model Updates**: Newer player, less battle-tested
- **Integration**: Fewer pre-built integrations

### OpenAI Realtime API
- **Expensive**: $20/hour makes it costly for production
- **No Voice Cloning**: Only OpenAI-curated voices
- **Latency**: ~500ms end-to-end still higher than specialized TTS
- **Rate Limits**: Limited to ~100 concurrent sessions for Tier 5

### PlayHT PlayDialog
- **Premium Pricing**: Higher cost ($0.40-0.80/1K chars)
- **Telephony Optimization**: Less focus on 8kHz telephony vs web-quality
- **Model Transition**: Legacy PlayHT 1.0 being retired June 2025

## Critical Telephony Considerations

### Audio Quality Reality Check
**8kHz Limitation**: PSTN networks operate at 8kHz, significantly degrading quality from 16kHz+ models.

### Latency Budget
- **Target**: Sub-1000ms mouth-to-ear
- **Network overhead**: 100-200ms fixed telephony latency
- **Processing chain**: STT (100ms) + LLM (320ms) + TTS (90ms) = 510ms minimum
- **Buffer time**: Additional 100-200ms for audio processing

## Emerging Players Worth Watching

### Open Source
- **XTTS-v2**: <150ms streaming, voice cloning with 6s samples (non-commercial license)
- **Chatterbox**: Emotion control, <200ms TTFB, MIT license
- **Kokoro**: Ultra-lightweight (82M params), <$1/million chars, Apache 2.0

### New Commercial
- **Fish Speech**: $9.99/month for 200 minutes, emotional breathing effects
- **Rime AI**: Sub-100ms on-premise deployment option

## Recommended Architecture (2025)

**For Production Telephony**:
1. **Primary**: Cartesia Sonic for latency-critical applications
2. **Backup**: ElevenLabs Flash v2.5 for quality-critical scenarios
3. **Cost-Conscious**: Deepgram Aura-2 for high-volume deployments
4. **Development**: OpenAI Realtime API for rapid prototyping

**Infrastructure Stack**:
- **Telephony**: Twilio Media Streams
- **STT**: Deepgram Nova-2 (telephony-optimized)
- **LLM**: GPT-4o-mini or Claude Haiku for speed
- **TTS**: Provider based on use case above
- **Hosting**: Edge deployment near Twilio ingress points

---

*Research conducted: December 2025*
*Decision: Starting with Deepgram Aura-2 (cheapest, already have Deepgram account)*
