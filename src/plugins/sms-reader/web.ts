import { WebPlugin } from '@capacitor/core';
import type { SmsReaderPlugin, SmsMessage } from './definitions';

export class SmsReaderWeb extends WebPlugin implements SmsReaderPlugin {
  async checkPermission(): Promise<{ granted: boolean }> {
    console.warn('SmsReader: Not available on web. Use the paste-based SMS import instead.');
    return { granted: false };
  }

  async requestPermission(): Promise<{ granted: boolean }> {
    console.warn('SmsReader: Not available on web. Use the paste-based SMS import instead.');
    return { granted: false };
  }

  async getMessages(_options: { maxCount?: number; daysBack?: number; startDate?: string; endDate?: string }): Promise<{ messages: SmsMessage[] }> {
    console.warn('SmsReader: Not available on web. Use the paste-based SMS import instead.');
    return { messages: [] };
  }

  async startListening(): Promise<void> {
    console.warn('SmsReader: SMS listening not available on web.');
  }

  async stopListening(): Promise<void> {
    console.warn('SmsReader: SMS listening not available on web.');
  }
}
