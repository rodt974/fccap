package com.buzzcast.recorder;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class RecorderService extends Service {

    private static final String CHANNEL_ID = "buzzcast_recorder";
    private static final int NOTIFICATION_ID = 1;

    private FacecastApi api;
    private TelegramBot telegram;
    private StreamDownloader downloader;
    private Handler handler;
    private boolean running = false;
    private int pollInterval = 30;
    private boolean onlyPrivate = true;
    private String[] watchIds = {};

    // Track stream states: userId -> StreamState
    private final Map<String, StreamState> streamStates = new HashMap<>();

    private static RecorderService instance;
    private LogCallback logCallback;

    public interface LogCallback {
        void onLog(String message);
    }

    public static RecorderService getInstance() {
        return instance;
    }

    public void setLogCallback(LogCallback callback) {
        this.logCallback = callback;
    }

    private void log(String msg) {
        String line = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.US)
                .format(new java.util.Date()) + " " + msg;
        if (logCallback != null) {
            new Handler(Looper.getMainLooper()).post(() -> logCallback.onLog(line));
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        createNotificationChannel();
        handler = new Handler(Looper.getMainLooper());

        File recordingsDir = new File(getExternalFilesDir(null), "recordings");
        downloader = new StreamDownloader(recordingsDir);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification("Surveillance en cours..."));

        SharedPreferences prefs = getSharedPreferences("config", MODE_PRIVATE);
        String userId = prefs.getString("userId", "");
        String token = prefs.getString("token", "");
        String botToken = prefs.getString("botToken", "");
        String chatId = prefs.getString("chatId", "");
        onlyPrivate = prefs.getBoolean("onlyPrivate", true);
        pollInterval = prefs.getInt("pollInterval", 30);
        String watchIdsStr = prefs.getString("watchIds", "");

        if (!watchIdsStr.isEmpty()) {
            watchIds = watchIdsStr.split(",");
            for (int i = 0; i < watchIds.length; i++) watchIds[i] = watchIds[i].trim();
        } else {
            watchIds = new String[0];
        }

        api = new FacecastApi(userId, token);
        telegram = new TelegramBot(botToken, chatId);

        running = true;
        log("Service demarre");
        log("Mode: " + (onlyPrivate ? "prives uniquement" : "tous les streams"));
        log("Intervalle: " + pollInterval + "s");

        new Thread(() -> telegram.sendMessage("BuzzCast Recorder demarre\nSurveillance en cours...")).start();

        startPolling();

        return START_STICKY;
    }

    private void startPolling() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!running) return;

                new Thread(() -> {
                    try {
                        poll();
                    } catch (Exception e) {
                        log("Erreur: " + e.getMessage());
                    }
                }).start();

                handler.postDelayed(this, pollInterval * 1000L);
            }
        }, 1000);
    }

    private void poll() {
        try {
            if (watchIds.length > 0) {
                for (String uid : watchIds) {
                    if (!uid.isEmpty()) checkUser(uid);
                }
            } else {
                checkFavorites();
            }

            // Re-check users currently being recorded
            for (String uid : new java.util.ArrayList<>(streamStates.keySet())) {
                StreamState state = streamStates.get(uid);
                if (state != null && state.recording) {
                    checkUser(uid);
                }
            }
        } catch (Exception e) {
            log("Erreur poll: " + e.getMessage());
        }
    }

    private void checkFavorites() {
        try {
            int page = 1;
            int totalPages = 1;

            while (page <= totalPages) {
                JSONObject data = api.getFavorites(page);
                if (data == null) break;

                JSONObject result = data.optJSONObject("result");
                if (result == null) break;

                totalPages = result.optInt("totalPage", 1);
                JSONArray list = result.optJSONArray("list");
                if (list == null) break;

                for (int i = 0; i < list.length(); i++) {
                    JSONObject user = list.getJSONObject(i);
                    JSONObject liveData = user.optJSONObject("liveData");
                    if (liveData != null && liveData.optInt("isLive", 0) == 1) {
                        String account = user.optString("account", "");
                        if (!account.isEmpty()) checkUser(account);
                    }
                }
                page++;
            }
        } catch (Exception e) {
            log("Erreur favoris: " + e.getMessage());
        }
    }

    private void checkUser(String userId) {
        try {
            JSONObject userInfo = api.getUserInfo(userId);
            if (userInfo == null) return;

            String nickName = api.getNickName(userInfo);
            boolean isLive = api.isLive(userInfo);
            boolean isPrivate = api.isPrivateStream(userInfo);
            StreamState state = streamStates.get(userId);

            // Stream just started
            if (isLive && (state == null || !state.live)) {
                log(nickName + " (" + userId + ") est LIVE" + (isPrivate ? " (PRIVE)" : ""));

                if (onlyPrivate && !isPrivate) {
                    log("Skip " + nickName + " - pas prive");
                    streamStates.put(userId, new StreamState(true, false, null, nickName, isPrivate));
                    return;
                }

                JSONObject liveInfo = api.getLiveInfo(userId);
                if (liveInfo == null) {
                    streamStates.put(userId, new StreamState(true, false, null, nickName, isPrivate));
                    return;
                }

                String streamId = api.getStreamId(liveInfo);
                if (streamId == null) {
                    streamStates.put(userId, new StreamState(true, false, null, nickName, isPrivate));
                    return;
                }

                String flvUrl = api.getFlvUrl(streamId);
                File outFile = downloader.startDownload(userId, nickName, streamId, flvUrl);

                if (outFile != null) {
                    log("Enregistrement: " + outFile.getName());
                    streamStates.put(userId, new StreamState(true, true, outFile, nickName, isPrivate));
                    telegram.notifyStreamStart(userId, nickName, isPrivate);
                    updateNotification("Enregistrement: " + nickName);
                }
            }

            // Stream just ended
            if (!isLive && state != null && state.live) {
                log(nickName + " (" + userId + ") OFFLINE");

                if (state.recording && downloader.isDownloading(userId)) {
                    File file = downloader.stopDownload(userId);

                    if (file != null && file.exists() && file.length() > 100000) {
                        long duration = (System.currentTimeMillis() - state.startTime) / 1000;
                        log("Envoi Telegram: " + file.getName());
                        telegram.notifyStreamEnd(userId, state.nickName, duration);
                        telegram.sendRecording(file, userId, state.nickName, state.isPrivate);
                        log("Envoye!");
                    } else if (file != null && file.exists()) {
                        log("Enregistrement trop court, supprime");
                        file.delete();
                    }
                }

                streamStates.remove(userId);
                updateNotification("Surveillance en cours...");
            }
        } catch (Exception e) {
            log("Erreur check " + userId + ": " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacksAndMessages(null);
        downloader.stopAll();
        new Thread(() -> telegram.sendMessage("BuzzCast Recorder arrete")).start();
        instance = null;
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.channel_name),
                    NotificationManager.IMPORTANCE_LOW);
            channel.setDescription(getString(R.string.channel_desc));

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String text) {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("BuzzCast Recorder")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
    }

    private void updateNotification(String text) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification(text));
        }
    }

    private static class StreamState {
        final boolean live;
        final boolean recording;
        final File file;
        final String nickName;
        final boolean isPrivate;
        final long startTime;

        StreamState(boolean live, boolean recording, File file, String nickName, boolean isPrivate) {
            this.live = live;
            this.recording = recording;
            this.file = file;
            this.nickName = nickName;
            this.isPrivate = isPrivate;
            this.startTime = System.currentTimeMillis();
        }
    }
}
