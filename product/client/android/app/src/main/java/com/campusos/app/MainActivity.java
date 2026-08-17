package com.campusos.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.WebSettings;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.Logger;

import java.util.Locale;
import java.util.regex.Pattern;

public class MainActivity extends BridgeActivity {
    public static final String NOTIFICATION_CHANNEL_ID = "campusos_alerts";

    private static final Pattern JWT_PATTERN = Pattern.compile("eyJ[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]*");
    private static final Pattern FCM_TOKEN_PATTERN = Pattern.compile("[a-zA-Z0-9_-]{100,}:[a-zA-Z0-9_-]{10,}");

    private static String sanitizeMessage(String message) {
        if (message == null) return "";
        String sanitized = JWT_PATTERN.matcher(message).replaceAll("[REDACTED_JWT]");
        return FCM_TOKEN_PATTERN.matcher(sanitized).replaceAll("[REDACTED_FCM_TOKEN]");
    }

    private void ensureNativeSystemBarsVisible() {
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (insetsController != null) {
                insetsController.show(WindowInsetsCompat.Type.statusBars());
                insetsController.show(WindowInsetsCompat.Type.navigationBars());
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CampusOSSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);

        // Ensure real native Android status bar is visible and not hidden by accidental fullscreen/immersive mode
        ensureNativeSystemBarsVisible();

        // Ensure high-priority notification channel is created at OS level before any push arrives
        createNotificationChannel();

        // Allow mixed content for local development and LAN testing on debug builds
        boolean isDebuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        if (isDebuggable && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Install token-sanitizing WebChromeClient to guarantee zero JWT/FCM token leaks to Logcat
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                    if (consoleMessage == null || consoleMessage.message() == null) {
                        return true;
                    }
                    String rawMsg = consoleMessage.message();
                    String sanitizedMsg = sanitizeMessage(rawMsg);

                    String tag = Logger.tags("Console");
                    String msg = String.format(
                        Locale.ROOT,
                        "File: %s - Line %d - Msg: %s",
                        consoleMessage.sourceId(),
                        consoleMessage.lineNumber(),
                        sanitizedMsg
                    );
                    ConsoleMessage.MessageLevel level = consoleMessage.messageLevel();
                    if (level == ConsoleMessage.MessageLevel.ERROR) {
                        Logger.error(tag, msg, null);
                    } else if (level == ConsoleMessage.MessageLevel.WARNING) {
                        Logger.warn(tag, msg);
                    } else if (level == ConsoleMessage.MessageLevel.DEBUG) {
                        Logger.debug(tag, msg);
                    } else {
                        Logger.info(tag, msg);
                    }
                    return true;
                }
            });
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "CampusOS High Priority Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Instant notification alerts for leave, approvals, tasks & circulars");
                channel.enableLights(true);
                channel.enableVibration(true);
                channel.setShowBadge(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

                Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
                channel.setSound(defaultSoundUri, audioAttributes);

                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        ensureNativeSystemBarsVisible();
        boolean isDebuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        if (isDebuggable && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}
