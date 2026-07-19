import type { PluginListenerHandle } from '@capacitor/core';

export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
}

export interface SmsReaderPlugin {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
  getMessages(options: { maxCount?: number; daysBack?: number; startDate?: string; endDate?: string }): Promise<{ messages: SmsMessage[] }>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  addListener(eventName: 'smsReceived', listenerFunc: (data: SmsMessage) => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}
