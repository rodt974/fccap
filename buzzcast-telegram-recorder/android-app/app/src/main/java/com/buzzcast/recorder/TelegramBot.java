package com.buzzcast.recorder;

import java.io.File;
import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class TelegramBot {

    private final String botToken;
    private final String chatId;
    private final OkHttpClient client;

    public TelegramBot(String botToken, String chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(300, java.util.concurrent.TimeUnit.SECONDS)
                .writeTimeout(300, java.util.concurrent.TimeUnit.SECONDS)
                .build();
    }

    private String apiUrl(String method) {
        return "https://api.telegram.org/bot" + botToken + "/" + method;
    }

    public void sendMessage(String text) {
        try {
            RequestBody body = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("chat_id", chatId)
                    .addFormDataPart("text", text)
                    .addFormDataPart("parse_mode", "HTML")
                    .build();

            Request request = new Request.Builder()
                    .url(apiUrl("sendMessage"))
                    .post(body)
                    .build();

            try (Response response = client.newCall(request).execute()) {
                // ignore response
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public boolean sendVideo(File file, String caption) {
        try {
            long sizeMB = file.length() / (1024 * 1024);

            if (sizeMB > 50) {
                return sendDocument(file, caption + "\n(trop gros pour video, envoye en document)");
            }

            MultipartBody.Builder builder = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("chat_id", chatId)
                    .addFormDataPart("video", file.getName(),
                            RequestBody.create(file, MediaType.parse("video/x-flv")));

            if (caption != null && !caption.isEmpty()) {
                builder.addFormDataPart("caption", caption.length() > 1024 ? caption.substring(0, 1024) : caption);
            }

            Request request = new Request.Builder()
                    .url(apiUrl("sendVideo"))
                    .post(builder.build())
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (response.isSuccessful()) return true;
            }

            // Fallback to document
            return sendDocument(file, caption);

        } catch (Exception e) {
            e.printStackTrace();
            try {
                return sendDocument(file, caption);
            } catch (Exception ex) {
                return false;
            }
        }
    }

    public boolean sendDocument(File file, String caption) {
        try {
            MultipartBody.Builder builder = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("chat_id", chatId)
                    .addFormDataPart("document", file.getName(),
                            RequestBody.create(file, MediaType.parse("application/octet-stream")));

            if (caption != null && !caption.isEmpty()) {
                builder.addFormDataPart("caption", caption.length() > 1024 ? caption.substring(0, 1024) : caption);
            }

            Request request = new Request.Builder()
                    .url(apiUrl("sendDocument"))
                    .post(builder.build())
                    .build();

            try (Response response = client.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void notifyStreamStart(String userId, String nickName, boolean isPrivate) {
        String type = isPrivate ? "PRIVE" : "LIVE";
        String text = type + "\n\n<b>" + nickName + "</b> (" + userId + ") est en stream"
                + (isPrivate ? " prive" : "") + ".\nEnregistrement en cours...";
        sendMessage(text);
    }

    public void notifyStreamEnd(String userId, String nickName, long durationSecs) {
        long mins = durationSecs / 60;
        long secs = durationSecs % 60;
        String text = "Stream termine\n\n<b>" + nickName + "</b> (" + userId + ")\nDuree: " + mins + "m " + secs + "s";
        sendMessage(text);
    }

    public void sendRecording(File file, String userId, String nickName, boolean isPrivate) {
        String type = isPrivate ? "Prive" : "Live";
        String caption = type + " - " + nickName + " (" + userId + ")\n" + new java.util.Date();
        sendVideo(file, caption);
    }
}
