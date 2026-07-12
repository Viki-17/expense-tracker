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
  getMessages(options: { maxCount?: number; daysBack?: number }): Promise<{ messages: SmsMessage[] }>;
}
