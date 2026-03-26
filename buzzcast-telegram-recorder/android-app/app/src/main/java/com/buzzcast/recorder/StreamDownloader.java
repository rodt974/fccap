package com.buzzcast.recorder;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class StreamDownloader {

    private final File outputDir;
    private final Map<String, DownloadTask> activeDownloads = new ConcurrentHashMap<>();

    public StreamDownloader(File outputDir) {
        this.outputDir = outputDir;
        if (!outputDir.exists()) outputDir.mkdirs();
    }

    public boolean isDownloading(String userId) {
        return activeDownloads.containsKey(userId);
    }

    public File startDownload(String userId, String nickName, String streamId, String flvUrl) {
        if (isDownloading(userId)) return null;

        String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", java.util.Locale.US)
                .format(new java.util.Date());
        String filename = "BuzzCast-" + userId + "-" + nickName + "-" + streamId + "-" + timestamp + ".flv";
        File outFile = new File(outputDir, filename);

        DownloadTask task = new DownloadTask(userId, flvUrl, outFile);
        activeDownloads.put(userId, task);

        Thread thread = new Thread(task);
        thread.setDaemon(true);
        thread.start();

        return outFile;
    }

    public File stopDownload(String userId) {
        DownloadTask task = activeDownloads.get(userId);
        if (task == null) return null;

        task.stop();
        activeDownloads.remove(userId);
        return task.outFile;
    }

    public void stopAll() {
        for (String userId : activeDownloads.keySet()) {
            stopDownload(userId);
        }
    }

    private static class DownloadTask implements Runnable {
        final String userId;
        final String url;
        final File outFile;
        volatile boolean running = true;

        DownloadTask(String userId, String url, File outFile) {
            this.userId = userId;
            this.url = url;
            this.outFile = outFile;
        }

        void stop() {
            running = false;
        }

        @Override
        public void run() {
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(0, java.util.concurrent.TimeUnit.SECONDS) // no read timeout for streaming
                    .build();

            Request request = new Request.Builder().url(url).get().build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) return;

                try (InputStream is = response.body().byteStream();
                     FileOutputStream fos = new FileOutputStream(outFile)) {

                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while (running && (bytesRead = is.read(buffer)) != -1) {
                        fos.write(buffer, 0, bytesRead);
                    }
                }
            } catch (IOException e) {
                // Stream ended or connection lost - this is normal
            }
        }
    }
}
