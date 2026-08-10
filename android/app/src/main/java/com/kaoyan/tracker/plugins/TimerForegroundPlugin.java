package com.kaoyan.tracker.plugins;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimerForeground")
public class TimerForegroundPlugin extends Plugin {

    private BroadcastReceiver stopReceiver;
    private boolean serviceRunning = false;

    @Override
    public void load() {
        stopReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (TimerForegroundService.ACTION_STOP_TIMER.equals(intent.getAction())) {
                    stopTimerService();
                    serviceRunning = false;
                    notifyListeners("timerStopped", new JSObject());
                }
            }
        };

        IntentFilter filter = new IntentFilter(TimerForegroundService.ACTION_STOP_TIMER);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getActivity().registerReceiver(stopReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getActivity().registerReceiver(stopReceiver, filter);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (stopReceiver != null) {
            try {
                getActivity().unregisterReceiver(stopReceiver);
            } catch (IllegalArgumentException ignored) {}
        }
    }

    @PluginMethod
    public void startTimer(PluginCall call) {
        String subject = call.getString("subject", "学习中");
        long startTimeMs = call.getLong("startTimeMs", System.currentTimeMillis());

        // Android 13+ 检查通知权限
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                // 请求通知权限
                getActivity().requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 9999);
                call.reject("需要通知权限才能后台计时，请授权后重试");
                return;
            }
        }

        Intent serviceIntent = TimerForegroundService.createStartIntent(getActivity(), subject, startTimeMs);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getActivity().startForegroundService(serviceIntent);
        } else {
            getActivity().startService(serviceIntent);
        }
        serviceRunning = true;
        call.resolve();
    }

    @PluginMethod
    public void stopTimer(PluginCall call) {
        stopTimerService();
        serviceRunning = false;
        call.resolve();
    }

    @PluginMethod
    public void updateTimer(PluginCall call) {
        String subject = call.getString("subject", "学习中");
        long elapsedSec = call.getLong("elapsedSec", 0L);

        // 通过向 Service 发送命令更新通知（简洁方式：直接重建通知）
        Intent serviceIntent = TimerForegroundService.createStartIntent(
            getActivity(), subject, System.currentTimeMillis() - elapsedSec * 1000
        );
        getActivity().startService(serviceIntent);

        call.resolve();
    }

    private void stopTimerService() {
        Intent serviceIntent = new Intent(getActivity(), TimerForegroundService.class);
        getActivity().stopService(serviceIntent);
    }
}