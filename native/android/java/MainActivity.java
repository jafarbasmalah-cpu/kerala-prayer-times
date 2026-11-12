package com.kerala.prayertimes;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KptNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
