package com.expensetracker.plugins;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "SmsReader")
public class SmsReaderPlugin extends Plugin {

    private static final int SMS_PERMISSION_REQUEST = 1001;
    private PluginCall pendingPermissionCall;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int result = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.READ_SMS
            );
            JSObject ret = new JSObject();
            ret.put("granted", result == PackageManager.PERMISSION_GRANTED);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int result = ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.READ_SMS
            );
            if (result == PackageManager.PERMISSION_GRANTED) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            } else {
                pendingPermissionCall = call;
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{Manifest.permission.READ_SMS},
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
            JSObject ret = new JSObject();
            ret.put("granted",
                grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
            );
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

        int maxCount = call.getInt("maxCount", 200);
        int daysBack = call.getInt("daysBack", 30);

        long sinceMillis = System.currentTimeMillis() - (daysBack * 24L * 60L * 60L * 1000L);

        JSObject ret = new JSObject();
        JSArray messages = new JSArray();

        Cursor cursor = null;
        try {
            Uri uri = Uri.parse("content://sms/inbox");
            String[] projection = {"_id", "address", "body", "date", "read"};
            String selection = "date > ?";
            String[] selectionArgs = {String.valueOf(sinceMillis)};
            String sortOrder = "date DESC LIMIT " + maxCount;

            cursor = getContext().getContentResolver().query(
                uri, projection, selection, selectionArgs, sortOrder
            );

            if (cursor != null && cursor.moveToFirst()) {
                do {
                    String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));

                    // Quick filter: only include SMS that look like financial transactions
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

    /**
     * Quick pre-filter: checks if an SMS looks like a financial transaction.
     * This avoids sending every SMS to JavaScript for parsing.
     */
    private boolean isTransactionSms(String body) {
        if (body == null || body.isEmpty()) return false;
        String lower = body.toLowerCase();

        // Keywords that strongly indicate a transaction SMS
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
