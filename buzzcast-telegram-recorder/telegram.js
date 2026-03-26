const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

class TelegramBot {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(text) {
    try {
      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: this.chatId,
        text,
        parse_mode: 'HTML'
      });
    } catch (err) {
      console.error('[TELEGRAM] Failed to send message:', err.message);
    }
  }

  async sendVideo(filepath, caption) {
    const stat = fs.statSync(filepath);
    const fileSizeMB = stat.size / (1024 * 1024);

    console.log(`[TELEGRAM] Sending video: ${path.basename(filepath)} (${fileSizeMB.toFixed(1)} MB)`);

    // Telegram limit: 50MB for bot API
    if (fileSizeMB > 50) {
      console.log(`[TELEGRAM] File too large (${fileSizeMB.toFixed(1)} MB), splitting...`);
      return this.sendLargeFile(filepath, caption);
    }

    try {
      const form = new FormData();
      form.append('chat_id', this.chatId);
      form.append('video', fs.createReadStream(filepath));
      if (caption) {
        form.append('caption', caption.substring(0, 1024));
      }

      await axios.post(`${this.apiUrl}/sendVideo`, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000
      });

      console.log('[TELEGRAM] Video sent successfully');
    } catch (err) {
      console.error('[TELEGRAM] Failed to send video:', err.message);
      // Fallback: send as document
      await this.sendDocument(filepath, caption);
    }
  }

  async sendDocument(filepath, caption) {
    try {
      const form = new FormData();
      form.append('chat_id', this.chatId);
      form.append('document', fs.createReadStream(filepath));
      if (caption) {
        form.append('caption', caption.substring(0, 1024));
      }

      await axios.post(`${this.apiUrl}/sendDocument`, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000
      });

      console.log('[TELEGRAM] Document sent successfully');
    } catch (err) {
      console.error('[TELEGRAM] Failed to send document:', err.message);
    }
  }

  async sendLargeFile(filepath, caption) {
    // For files > 50MB, split into parts using ffmpeg
    const { spawn } = require('child_process');
    const dir = path.dirname(filepath);
    const ext = path.extname(filepath);
    const base = path.basename(filepath, ext);
    const partPattern = path.join(dir, `${base}_part%03d${ext}`);

    // Split into 45MB segments
    const segmentDuration = 900; // 15 min segments as approximation

    return new Promise((resolve) => {
      const proc = spawn('ffmpeg', [
        '-i', filepath,
        '-c', 'copy',
        '-f', 'segment',
        '-segment_time', String(segmentDuration),
        '-reset_timestamps', '1',
        partPattern
      ]);

      proc.on('close', async () => {
        // Find and send all parts
        const files = fs.readdirSync(dir)
          .filter(f => f.startsWith(`${base}_part`) && f.endsWith(ext))
          .sort();

        for (let i = 0; i < files.length; i++) {
          const partPath = path.join(dir, files[i]);
          const partCaption = `${caption}\n\nPart ${i + 1}/${files.length}`;

          try {
            await this.sendDocument(partPath, partCaption);
          } catch (err) {
            console.error(`[TELEGRAM] Failed to send part ${i + 1}:`, err.message);
          }

          // Clean up part file
          fs.unlinkSync(partPath);
        }

        resolve();
      });

      proc.on('error', (err) => {
        console.error('[TELEGRAM] Failed to split file:', err.message);
        resolve();
      });
    });
  }

  async notifyStreamStart(userId, nickName, isPrivate) {
    const type = isPrivate ? '🔒 PRIVE' : '🔴 LIVE';
    const text = `${type}\n\n<b>${nickName}</b> (${userId}) est en stream${isPrivate ? ' privé' : ''}.\nEnregistrement en cours...`;
    await this.sendMessage(text);
  }

  async notifyStreamEnd(userId, nickName, duration) {
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const text = `⏹ Stream terminé\n\n<b>${nickName}</b> (${userId})\nDurée: ${mins}m ${secs}s`;
    await this.sendMessage(text);
  }

  async sendRecording(filepath, userId, nickName, isPrivate) {
    const type = isPrivate ? '🔒 Privé' : '🔴 Live';
    const caption = `${type} - ${nickName} (${userId})\n${new Date().toLocaleString()}`;
    await this.sendVideo(filepath, caption);
  }
}

module.exports = TelegramBot;
