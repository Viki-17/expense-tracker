package com.kaikanakku.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(com.kaikanakku.plugins.SmsReaderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
