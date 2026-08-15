package com.kaoyan.tracker;

import com.getcapacitor.BridgeActivity;
import com.kaoyan.tracker.plugins.TimerForegroundPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(TimerForegroundPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
