package com.expensetracker.plugins;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "SmsReader")
public class SmsReaderPlugin extends Plugin {

    private static final int SMS_PERMISSION_REQUEST = 1001;
    private PluginCall pendingPermissionCall;
    private BroadcastReceiver smsReceiver;
    private boolean isListening = false;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int readResult = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.READ_SMS
            );
            int receiveResult = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.RECEIVE_SMS
            );
            ret.put("granted", readResult == PackageManager.PERMISSION_GRANTED
                && receiveResult == PackageManager.PERMISSION_GRANTED);
        } else {
            ret.put("granted", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int readResult = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.READ_SMS
            );
            int receiveResult = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.RECEIVE_SMS
            );
            if (readResult == PackageManager.PERMISSION_GRANTED
                && receiveResult == PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            } else {
                pendingPermissionCall = call;
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS},
                    SMS_PERMISSION_REQUEST
                );
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == SMS_PERMISSION_REQUEST && pendingPermissionCall != null) {
            boolean allGranted = grantResults.length > 0;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            JSObject ret = new JSObject();
            ret.put("granted", allGranted);
            pendingPermissionCall.resolve(ret);
            pendingPermissionCall = null;
        }
    }

    @PluginMethod
    public void getMessages(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int result = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.READ_SMS
            );
            if (result != PackageManager.PERMISSION_GRANTED) {
                call.reject("READ_SMS permission not granted");
                return;
            }
        }

        int maxCount = call.getInt("maxCount", 1000);
        int daysBack = call.getInt("daysBack", 730);
        String startDate = call.getString("startDate");
        String endDate = call.getString("endDate");

        long startMillis;
        long endMillis = System.currentTimeMillis();
        boolean hasRange = false;
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);

        if (startDate != null && !startDate.isEmpty()) {
            try {
                Date parsedStart = dateFormat.parse(startDate);
                Calendar startCal = Calendar.getInstance();
                startCal.setTime(parsedStart);
                startCal.set(Calendar.HOUR_OF_DAY, 0);
                startCal.set(Calendar.MINUTE, 0);
                startCal.set(Calendar.SECOND, 0);
                startCal.set(Calendar.MILLISECOND, 0);
                startMillis = startCal.getTimeInMillis();
                hasRange = true;
            } catch (Exception e) {
                startMillis = System.currentTimeMillis() - (daysBack * 24L * 60L * 60L * 1000L);
            }
        } else {
            startMillis = System.currentTimeMillis() - (daysBack * 24L * 60L * 60L * 1000L);
        }

        if (endDate != null && !endDate.isEmpty()) {
            try {
                Date parsedEnd = dateFormat.parse(endDate);
                Calendar endCal = Calendar.getInstance();
                endCal.setTime(parsedEnd);
                endCal.set(Calendar.HOUR_OF_DAY, 23);
                endCal.set(Calendar.MINUTE, 59);
                endCal.set(Calendar.SECOND, 59);
                endCal.set(Calendar.MILLISECOND, 999);
                endMillis = endCal.getTimeInMillis();
                hasRange = true;
            } catch (Exception e) {
                // keep default endMillis
            }
        }

        JSObject ret = new JSObject();
        JSArray messages = new JSArray();

        Cursor cursor = null;
        try {
            Uri uri = Uri.parse("content://sms/inbox");
            String[] projection = {"_id", "address", "body", "date", "read"};
            String selection;
            String[] selectionArgs;
            if (hasRange) {
                selection = "date >= ? AND date <= ?";
                selectionArgs = new String[]{String.valueOf(startMillis), String.valueOf(endMillis)};
            } else {
                selection = "date > ?";
                selectionArgs = new String[]{String.valueOf(startMillis)};
            }
            String sortOrder = "date DESC LIMIT " + maxCount;

            cursor = getContext().getContentResolver().query(
                uri, projection, selection, selectionArgs, sortOrder
            );

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));

                    if (!isTransactionSms(body)) {
                        continue;
                    }

                    JSObject msg = new JSObject();
                    msg.put("id", cursor.getString(cursor.getColumnIndexOrThrow("_id")));
                    msg.put("address", cursor.getString(cursor.getColumnIndexOrThrow("address")));
                    msg.put("body", body);
                    msg.put("date", cursor.getLong(cursor.getColumnIndexOrThrow("date")));
                    msg.put("read", cursor.getInt(cursor.getColumnIndexOrThrow("read")) == 1);
                    messages.put(msg);
                } while (cursor.moveToNext());
            }
        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage());
            return;
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        ret.put("messages", messages);
        call.resolve(ret);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (isListening) {
            call.resolve();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int result = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.RECEIVE_SMS
            );
            if (result != PackageManager.PERMISSION_GRANTED) {
                call.reject("RECEIVE_SMS permission not granted");
                return;
            }
        }

        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
                    return;
                }
                Bundle bundle = intent.getExtras();
                if (bundle == null) return;

                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus == null) return;

                for (Object pdu : pdus) {
                    SmsMessage message;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        message = SmsMessage.createFromPdu((byte[]) pdu, bundle.getString("format"));
                    } else {
                        message = SmsMessage.createFromPdu((byte[]) pdu);
                    }
                    String body = message.getMessageBody();
                    String address = message.getOriginatingAddress();
                    long date = message.getTimestampMillis();

                    if (isTransactionSms(body)) {
                        JSObject msg = new JSObject();
                        msg.put("id", String.valueOf(System.currentTimeMillis()));
                        msg.put("address", address != null ? address : "");
                        msg.put("body", body != null ? body : "");
                        msg.put("date", date);
                        msg.put("read", false);
                        notifyListeners("smsReceived", msg);
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
        filter.setPriority(IntentFilter.SYSTEM_HIGH_PRIORITY);
        getContext().registerReceiver(smsReceiver, filter);
        isListening = true;
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        if (smsReceiver != null && isListening) {
            try {
                getContext().unregisterReceiver(smsReceiver);
            } catch (Exception e) {
                // Receiver was not registered or already unregistered
            }
            smsReceiver = null;
            isListening = false;
        }
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        if (smsReceiver != null && isListening) {
            try {
                getContext().unregisterReceiver(smsReceiver);
            } catch (Exception e) {
                // Ignore
            }
            smsReceiver = null;
            isListening = false;
        }
        super.handleOnDestroy();
    }

    /**
     * Quick pre-filter: checks if an SMS looks like a financial transaction.
     * This avoids sending every SMS to JavaScript for parsing.
     */
    private boolean isTransactionSms(String body) {
        if (body == null || body.isEmpty()) return false;
        String lower = body.toLowerCase();

        String[] keywords = {
            "debited", "credited", "spent", "paid", "payment",
            "withdrawn", "deposited", "purchased", "rs.", "inr",
            "balance", "avl", "available", "txn", "transaction",
            "neft", "imps", "rtgs", "upi", "emi", "bill",
            "credit card", "debit card", "a/c", "account",
            "ref no", "ref.", "reference"
        };

        for (String keyword : keywords) {
            if (lower.contains(keyword)) return true;
        }
        return false;
    }
}
