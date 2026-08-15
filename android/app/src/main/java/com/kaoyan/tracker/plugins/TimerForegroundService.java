package com.kaoyan.tracker.plugins;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import com.kaoyan.tracker.R;

public class TimerForegroundService extends Service {
    public static final String CHANNEL_ID = "kaoyan_timer_channel";
    public static final int NOTIFICATION_ID = 1001;
    public static final String ACTION_STOP_TIMER = "com.kaoyan.tracker.STOP_TIMER";

    private static final String EXTRA_SUBJECT = "subject";
    private static final String EXTRA_START_TIME = "start_time_ms";

    private Handler handler;
    private Runnable updateRunnable;
    private String subject;
    private long startTimeMs;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            subject = intent.getStringExtra(EXTRA_SUBJECT);
            startTimeMs = intent.getLongExtra(EXTRA_START_TIME, System.currentTimeMillis());
        }
        if (subject == null) subject = "学习中";

        // 仅首次启动时调用 startForeground 和 startUpdating
        if (updateRunnable == null) {
            startForeground(NOTIFICATION_ID, buildNotification());
            startUpdating();
        }

        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopUpdating();
        super.onDestroy();
    }

    /** 更新通知内容（供插件直接调用） */
    public void updateNotification(String newSubject, long elapsedSec) {
        this.subject = newSubject;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotificationWithElapsed(elapsedSec));
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "学习计时",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("学习计时器运行中");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        long elapsed = (System.currentTimeMillis() - startTimeMs) / 1000;
        return buildNotificationWithElapsed(elapsed);
    }

    private Notification buildNotificationWithElapsed(long elapsedSec) {
        String timeStr = formatElapsed(elapsedSec);
        String content = subject + "  ·  " + timeStr;

        // 点击通知回到 App
        Intent appIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent appPendingIntent = PendingIntent.getActivity(
            this, 0, appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // 停止按钮 → 发送广播给插件
        Intent stopIntent = new Intent(ACTION_STOP_TIMER);
        stopIntent.setPackage(getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
            this, 0, stopIntent, flags
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_icon)
            .setContentTitle("考研追踪")
            .setContentText(content)
            .setOngoing(true)
            .setContentIntent(appPendingIntent)
            .addAction(android.R.drawable.ic_media_pause, "停止", stopPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void startUpdating() {
        updateRunnable = new Runnable() {
            @Override
            public void run() {
                NotificationManager manager = getSystemService(NotificationManager.class);
                if (manager != null) {
                    manager.notify(NOTIFICATION_ID, buildNotification());
                }
                handler.postDelayed(this, 1000);
            }
        };
        handler.post(updateRunnable);
    }

    private void stopUpdating() {
        if (updateRunnable != null) {
            handler.removeCallbacks(updateRunnable);
            updateRunnable = null;
        }
    }

    static String formatElapsed(long totalSeconds) {
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        return String.format("%02d:%02d:%02d", hours, minutes, seconds);
    }

    /** 创建启动 Service 的 Intent */
    public static Intent createStartIntent(Context context, String subject, long startTimeMs) {
        Intent intent = new Intent(context, TimerForegroundService.class);
        intent.putExtra(EXTRA_SUBJECT, subject);
        intent.putExtra(EXTRA_START_TIME, startTimeMs);
        return intent;
    }
}