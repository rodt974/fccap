package com.buzzcast.recorder;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URLEncoder;

import okhttp3.FormBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class FacecastApi {

    private static final String BASE_URL = "https://dhcxzil.facecast.xyz/faceshow";
    private static final String LIVE_URL = "https://live.facecast.xyz/live";

    private final OkHttpClient client;
    private final String userId;
    private final String token;

    public FacecastApi(String userId, String token) {
        this.userId = userId;
        this.token = token;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .build();
    }

    private String randomSlashes() {
        int count = (int) (Math.random() * 10);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) sb.append('/');
        return sb.toString();
    }

    public JSONObject getUserInfo(String targetUserId) throws IOException {
        String url = BASE_URL + "/tokens/PersonalHome/" + randomSlashes()
                + "findHomeUserInfo?userId=" + targetUserId;

        RequestBody body = new FormBody.Builder()
                .add("systoken", token)
                .add("userId", targetUserId)
                .build();

        Request request = new Request.Builder().url(url).post(body).build();

        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                return new JSONObject(response.body().string());
            }
        } catch (Exception e) {
            throw new IOException("getUserInfo failed: " + e.getMessage());
        }
        return null;
    }

    public JSONObject getLiveInfo(String targetUserId) throws IOException {
        String url = BASE_URL + "/tokens/ranking/v2/getLastLiveInfoByUserId?liveUserId=" + targetUserId;

        Request request = new Request.Builder().url(url).get().build();

        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                return new JSONObject(response.body().string());
            }
        } catch (Exception e) {
            throw new IOException("getLiveInfo failed: " + e.getMessage());
        }
        return null;
    }

    public JSONObject getFavorites(int page) throws IOException {
        String url = BASE_URL + "/user/attention/" + randomSlashes() + "listAttention";

        RequestBody body = new FormBody.Builder()
                .add("systoken", token)
                .add("userId", userId)
                .add("currPage", String.valueOf(page))
                .add("pageSize", "20")
                .add("types", "0")
                .build();

        Request request = new Request.Builder().url(url).post(body).build();

        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                return new JSONObject(response.body().string());
            }
        } catch (Exception e) {
            throw new IOException("getFavorites failed: " + e.getMessage());
        }
        return null;
    }

    public boolean isLive(JSONObject userInfo) {
        try {
            JSONObject result = userInfo.getJSONObject("result");
            return result.getInt("isLive") == 1;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isPrivateStream(JSONObject userInfo) {
        try {
            JSONObject result = userInfo.getJSONObject("result");
            JSONObject liveData = result.getJSONObject("liveData");
            String flvUrl = liveData.optString("flv_url", "");
            int isLive = result.getInt("isLive");
            return !flvUrl.isEmpty() && isLive == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public String getNickName(JSONObject userInfo) {
        try {
            return userInfo.getJSONObject("result").getString("nickName");
        } catch (Exception e) {
            return "unknown";
        }
    }

    public String getStreamId(JSONObject liveInfo) {
        try {
            return liveInfo.getJSONObject("result").getString("streamId");
        } catch (Exception e) {
            return null;
        }
    }

    public String getLiveId(JSONObject liveInfo) {
        try {
            return liveInfo.getJSONObject("result").getString("liveId");
        } catch (Exception e) {
            return null;
        }
    }

    public String getFlvUrl(String streamId) {
        return LIVE_URL + "/" + streamId + ".flv";
    }

    public String getHlsUrl(String streamId) {
        return LIVE_URL + "/" + streamId + ".m3u8";
    }
}
