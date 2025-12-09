/**
 * Logger Service - Interaction Logging
 * Handles logging of call interactions to files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..', '..');

class LoggerService {
  constructor() {
    this.logFile = path.join(ROOT_DIR, 'interactions.jsonl');
    this.funnyLogFile = path.join(ROOT_DIR, 'funny-interactions.log');
  }

  async logInteraction(callSid, userInput, response, metadata = {}) {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      callSid,
      mood: metadata.mood || 'unknown',
      user: userInput,
      receptionist: response,
      ...metadata
    };

    try {
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');

      if (this._isFunnyInteraction(response, metadata)) {
        await this._logFunnyInteraction(timestamp, metadata.mood, userInput, response, metadata.note);
      }
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }

  _isFunnyInteraction(response, metadata) {
    return response.length > 100 ||
           response.includes("Yale") ||
           response.includes("latte") ||
           metadata.wasHilarious;
  }

  async _logFunnyInteraction(timestamp, mood, userInput, response, note) {
    const funnyEntry = `
=== ${timestamp} | ${mood || 'unknown'} ===
User: ${userInput}
Receptionist: ${response}
${note ? `Note: ${note}` : ''}
==================
`;
    await fs.appendFile(this.funnyLogFile, funnyEntry);
  }

  async getRecentLogs(count = 50) {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.slice(-count).map(line => JSON.parse(line));
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }
}

export default new LoggerService();
