import { useEffect, useRef } from 'react';
import SmsReader from '../plugins/sms-reader';
import type { SmsMessage } from '../plugins/sms-reader/definitions';
import type { PluginListenerHandle } from '@capacitor/core';
import { parseSMS } from '../utils/smsParser';
import { db } from '../db';
import { isNativePlatform } from '../utils/platform';
import { getAutoImportMerchants, addAutoImportMerchant } from '../utils/autoImport';

const MIN_AUTO_CONFIDENCE = 85;

const lastBodyRef: { current: string } = { current: '' };

export function useSmsListener() {
  const listenerRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    const isNative = isNativePlatform();
    if (!isNative) return;

    let cancelled = false;

    async function setupListener() {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }

      const perm = await SmsReader.checkPermission();
      if (!perm.granted || cancelled) return;

      try {
        await SmsReader.startListening();
      } catch {
        return;
      }

      const handle = await SmsReader.addListener('smsReceived', async (msg: SmsMessage) => {
        if (!msg.body || msg.body === lastBodyRef.current) return;
        lastBodyRef.current = msg.body;

        const result = parseSMS(msg.body);
        if (!result) return;

        try {
          const existingCount = await db.transactions.where('smsText').equals(result.raw).count();
          if (existingCount > 0) return;

          const autoMerchants = getAutoImportMerchants().map((m) => m.toLowerCase());
          const merchantMatch = result.merchant && autoMerchants.includes(result.merchant.toLowerCase());
          const shouldAutoImport = merchantMatch || result.confidence >= MIN_AUTO_CONFIDENCE;

          if (!shouldAutoImport) return;

          const sameDay = await db.transactions
            .where('[type+date]')
            .equals([result.type, result.date])
            .toArray();
          if (sameDay.find((t) => t.amount === result.amount)) return;

          await db.transactions.add({
            amount: result.amount,
            type: result.type,
            category: result.category,
            description: result.description,
            merchant: result.merchant,
            date: result.date,
            source: 'sms',
            smsText: result.raw,
            createdAt: new Date().toISOString(),
          });

          if (result.merchant) {
            addAutoImportMerchant(result.merchant);
          }
        } catch {
          // Silently ignore individual parse/store errors
        }
      });

      if (!cancelled) {
        listenerRef.current = handle;
      }
    }

    setupListener();

    const onPermissionGranted = () => {
      setupListener();
    };
    window.addEventListener('smsPermissionGranted', onPermissionGranted);

    return () => {
      cancelled = true;
      window.removeEventListener('smsPermissionGranted', onPermissionGranted);
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, []);
}
