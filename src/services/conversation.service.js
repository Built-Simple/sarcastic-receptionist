/**
 * Conversation Service - State Management
 * Manages conversation state, voice selections, and call statuses
 */

class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.callVoices = new Map();
    this.callStatuses = new Map();
  }

  createConversation(callSid, fromNumber) {
    const conversation = {
      history: [],
      callCount: 0,
      startTime: new Date(),
      fromNumber
    };
    this.conversations.set(callSid, conversation);
    return conversation;
  }

  getConversation(callSid) {
    return this.conversations.get(callSid) || { history: [], callCount: 0 };
  }

  updateConversation(callSid, userInput, assistantResponse) {
    const conversation = this.getConversation(callSid);
    conversation.callCount++;
    conversation.history.push(
      { role: "user", content: userInput },
      { role: "assistant", content: assistantResponse }
    );
    this.conversations.set(callSid, conversation);
    return conversation;
  }

  incrementCallCount(callSid) {
    const conversation = this.getConversation(callSid);
    conversation.callCount++;
    this.conversations.set(callSid, conversation);
    return conversation;
  }

  deleteConversation(callSid) {
    this.conversations.delete(callSid);
  }

  setCallVoice(callSid, voice, style) {
    this.callVoices.set(callSid, { voice, style });
  }

  getCallVoice(callSid) {
    return this.callVoices.get(callSid) || { voice: 'Polly.Amy-Neural', style: 'sarcastic' };
  }

  deleteCallVoice(callSid) {
    this.callVoices.delete(callSid);
  }

  setCallStatus(callSid, status) {
    this.callStatuses.set(callSid, {
      status,
      timestamp: new Date().toISOString()
    });
  }

  getCallStatus(callSid) {
    return this.callStatuses.get(callSid) || {
      status: 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  deleteCallStatus(callSid) {
    this.callStatuses.delete(callSid);
  }

  cleanupCall(callSid, delayStatusCleanup = 60000) {
    this.deleteConversation(callSid);
    this.deleteCallVoice(callSid);
    console.log(`🧹 Cleaned up data for call ${callSid}`);

    if (delayStatusCleanup > 0) {
      setTimeout(() => {
        this.deleteCallStatus(callSid);
      }, delayStatusCleanup);
    } else {
      this.deleteCallStatus(callSid);
    }
  }

  getActiveConversationCount() {
    return this.conversations.size;
  }
}

export default new ConversationService();
