import { registerPlugin } from '@capacitor/core';
import type { SmsReaderPlugin } from './definitions';

const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReader', {
  web: () => import('./web').then((m) => new m.SmsReaderWeb()),
});

export default SmsReader;
