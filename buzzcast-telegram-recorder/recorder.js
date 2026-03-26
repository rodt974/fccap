const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

class StreamRecorder {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.activeRecordings = new Map();
    fs.ensureDirSync(outputDir);
  }

  isRecording(userId) {
    return this.activeRecordings.has(userId);
  }

  startRecording(userId, nickName, streamId, streamUrl, maxDuration) {
    if (this.isRecording(userId)) {
      console.log(`[RECORDER] Already recording ${userId}`);
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `BuzzCast-${userId}-${nickName}-${streamId}-${timestamp}.flv`;
    const filepath = path.join(this.outputDir, filename);

    console.log(`[RECORDER] Starting recording: ${filename}`);
    console.log(`[RECORDER] Stream URL: ${streamUrl}`);

    // Use ffmpeg to record the FLV stream
    const args = [
      '-y',
      '-i', streamUrl,
      '-c', 'copy',
      '-t', String(maxDuration),
      '-f', 'flv',
      filepath
    ];

    const proc = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const recording = {
      userId,
      nickName,
      streamId,
      filepath,
      filename,
      process: proc,
      startTime: new Date()
    };

    proc.stderr.on('data', (data) => {
      // ffmpeg outputs to stderr normally, only log errors
      const msg = data.toString();
      if (msg.includes('Error') || msg.includes('error')) {
        console.log(`[RECORDER] ffmpeg error for ${userId}: ${msg.trim()}`);
      }
    });

    proc.on('close', (code) => {
      console.log(`[RECORDER] Recording finished for ${userId} (exit code: ${code})`);
      this.activeRecordings.delete(userId);
    });

    proc.on('error', (err) => {
      console.error(`[RECORDER] Failed to start ffmpeg for ${userId}:`, err.message);
      this.activeRecordings.delete(userId);
    });

    this.activeRecordings.set(userId, recording);
    return recording;
  }

  stopRecording(userId) {
    const recording = this.activeRecordings.get(userId);
    if (!recording) return null;

    console.log(`[RECORDER] Stopping recording for ${userId}`);
    // Send 'q' to ffmpeg for graceful stop
    recording.process.stdin.write('q');

    return new Promise((resolve) => {
      recording.process.on('close', () => {
        resolve(recording);
      });
      // Force kill after 10s if not stopped
      setTimeout(() => {
        if (this.activeRecordings.has(userId)) {
          recording.process.kill('SIGKILL');
          this.activeRecordings.delete(userId);
          resolve(recording);
        }
      }, 10000);
    });
  }

  async stopAll() {
    const promises = [];
    for (const userId of this.activeRecordings.keys()) {
      promises.push(this.stopRecording(userId));
    }
    return Promise.all(promises);
  }

  getRecordingInfo(userId) {
    return this.activeRecordings.get(userId) || null;
  }
}

module.exports = StreamRecorder;
