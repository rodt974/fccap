package com.buzzcast.recorder;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private EditText etUserId, etToken, etBotToken, etChatId, etWatchIds, etInterval;
    private CheckBox cbOnlyPrivate;
    private Button btnStart, btnStop, btnSave;
    private TextView tvStatus;
    private boolean serviceRunning = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        etUserId = findViewById(R.id.etUserId);
        etToken = findViewById(R.id.etToken);
        etBotToken = findViewById(R.id.etBotToken);
        etChatId = findViewById(R.id.etChatId);
        etWatchIds = findViewById(R.id.etWatchIds);
        etInterval = findViewById(R.id.etInterval);
        cbOnlyPrivate = findViewById(R.id.cbOnlyPrivate);
        btnStart = findViewById(R.id.btnStart);
        btnStop = findViewById(R.id.btnStop);
        btnSave = findViewById(R.id.btnSave);
        tvStatus = findViewById(R.id.tvStatus);

        loadConfig();
        requestPermissions();

        btnSave.setOnClickListener(v -> saveConfig());

        btnStart.setOnClickListener(v -> {
            if (validate()) {
                saveConfig();
                startRecorderService();
            }
        });

        btnStop.setOnClickListener(v -> stopRecorderService());

        // Reconnect to running service
        if (RecorderService.getInstance() != null) {
            serviceRunning = true;
            updateButtons();
            RecorderService.getInstance().setLogCallback(this::appendLog);
        }
    }

    private boolean validate() {
        if (etUserId.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "User ID requis", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (etToken.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Token requis", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (etBotToken.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Bot Token Telegram requis", Toast.LENGTH_SHORT).show();
            return false;
        }
        if (etChatId.getText().toString().trim().isEmpty()) {
            Toast.makeText(this, "Chat ID Telegram requis", Toast.LENGTH_SHORT).show();
            return false;
        }
        return true;
    }

    private void saveConfig() {
        SharedPreferences prefs = getSharedPreferences("config", MODE_PRIVATE);
        prefs.edit()
                .putString("userId", etUserId.getText().toString().trim())
                .putString("token", etToken.getText().toString().trim())
                .putString("botToken", etBotToken.getText().toString().trim())
                .putString("chatId", etChatId.getText().toString().trim())
                .putString("watchIds", etWatchIds.getText().toString().trim())
                .putBoolean("onlyPrivate", cbOnlyPrivate.isChecked())
                .putInt("pollInterval", parseInterval())
                .apply();
        Toast.makeText(this, "Config sauvegardee", Toast.LENGTH_SHORT).show();
    }

    private void loadConfig() {
        SharedPreferences prefs = getSharedPreferences("config", MODE_PRIVATE);
        etUserId.setText(prefs.getString("userId", ""));
        etToken.setText(prefs.getString("token", ""));
        etBotToken.setText(prefs.getString("botToken", ""));
        etChatId.setText(prefs.getString("chatId", ""));
        etWatchIds.setText(prefs.getString("watchIds", ""));
        cbOnlyPrivate.setChecked(prefs.getBoolean("onlyPrivate", true));
        etInterval.setText(String.valueOf(prefs.getInt("pollInterval", 30)));
    }

    private int parseInterval() {
        try {
            int val = Integer.parseInt(etInterval.getText().toString().trim());
            return Math.max(10, val);
        } catch (Exception e) {
            return 30;
        }
    }

    private void startRecorderService() {
        Intent intent = new Intent(this, RecorderService.class);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }

        serviceRunning = true;
        updateButtons();
        appendLog("Service demarre");

        // Connect log callback
        new android.os.Handler().postDelayed(() -> {
            if (RecorderService.getInstance() != null) {
                RecorderService.getInstance().setLogCallback(this::appendLog);
            }
        }, 500);
    }

    private void stopRecorderService() {
        Intent intent = new Intent(this, RecorderService.class);
        stopService(intent);
        serviceRunning = false;
        updateButtons();
        appendLog("Service arrete");
    }

    private void updateButtons() {
        btnStart.setEnabled(!serviceRunning);
        btnStop.setEnabled(serviceRunning);
    }

    private void appendLog(String msg) {
        runOnUiThread(() -> {
            tvStatus.append(msg + "\n");
            // Keep last 50 lines
            String text = tvStatus.getText().toString();
            String[] lines = text.split("\n");
            if (lines.length > 50) {
                StringBuilder sb = new StringBuilder();
                for (int i = lines.length - 50; i < lines.length; i++) {
                    sb.append(lines[i]).append("\n");
                }
                tvStatus.setText(sb.toString());
            }
        });
    }

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
            }
        }
    }
}
