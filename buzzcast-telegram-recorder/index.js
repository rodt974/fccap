const fs = require('fs-extra');
const path = require('path');
const FacecastAPI = require('./facecast-api');
const StreamRecorder = require('./recorder');
const TelegramBot = require('./telegram');

// Load config
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('config.json not found. Copy config.json and fill in your details.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Validate config
if (!config.facecast.userId || !config.facecast.token) {
  console.error('Missing facecast userId or token in config.json');
  console.error('Get these from the BuzzCast app (localStorage: myUserId, myToken)');
  process.exit(1);
}

if (!config.telegram.botToken || !config.telegram.chatId) {
  console.error('Missing telegram botToken or chatId in config.json');
  console.error('1. Create a bot via @BotFather on Telegram');
  console.error('2. Get your chat ID via @userinfobot');
  process.exit(1);
}

// Init modules
const api = new FacecastAPI(config.facecast.userId, config.facecast.token);
const recorder = new StreamRecorder(config.recording.outputDir || './recordings');
const telegram = new TelegramBot(config.telegram.botToken, config.telegram.chatId);

// Track stream states
const streamStates = new Map();

async function checkUser(userId) {
  try {
    const userInfo = await api.getUserInfo(userId);
    if (!userInfo || !userInfo.result) return;

    const nickName = userInfo.result.nickName || userId;
    const isLive = api.isLive(userInfo);
    const isPrivate = api.isPrivateStream(userInfo);
    const wasLive = streamStates.get(userId);

    // Stream just started
    if (isLive && !wasLive) {
      console.log(`[WATCH] ${nickName} (${userId}) is now LIVE${isPrivate ? ' (PRIVATE)' : ''}`);

      // Check if we should record (onlyPrivate filter)
      if (config.facecast.onlyPrivate && !isPrivate) {
        console.log(`[WATCH] Skipping ${nickName} - not private (onlyPrivate mode)`);
        streamStates.set(userId, { live: true, recording: false });
        return;
      }

      // Get stream info for recording
      const liveInfo = await api.getLiveInfo(userId);
      if (!liveInfo || !liveInfo.result) {
        console.log(`[WATCH] Could not get live info for ${nickName}`);
        streamStates.set(userId, { live: true, recording: false });
        return;
      }

      const streamId = liveInfo.result.streamId;
      const urls = api.getStreamUrls(streamId);

      // Start recording
      const recording = recorder.startRecording(
        userId,
        nickName,
        streamId,
        urls.flv,
        config.recording.maxDuration || 3600
      );

      if (recording) {
        streamStates.set(userId, { live: true, recording: true, streamId, nickName, isPrivate, startTime: Date.now() });
        await telegram.notifyStreamStart(userId, nickName, isPrivate);
      }
    }

    // Stream just ended
    if (!isLive && wasLive && wasLive.live) {
      console.log(`[WATCH] ${nickName} (${userId}) went OFFLINE`);

      if (wasLive.recording && recorder.isRecording(userId)) {
        const recording = await recorder.stopRecording(userId);

        if (recording && fs.existsSync(recording.filepath)) {
          const stat = fs.statSync(recording.filepath);
          if (stat.size > 100000) { // > 100KB (not empty)
            const duration = Math.floor((Date.now() - wasLive.startTime) / 1000);
            await telegram.notifyStreamEnd(userId, wasLive.nickName, duration);
            await telegram.sendRecording(recording.filepath, userId, wasLive.nickName, wasLive.isPrivate);
            console.log(`[WATCH] Recording sent to Telegram: ${recording.filename}`);
          } else {
            console.log(`[WATCH] Recording too small, discarding: ${recording.filename}`);
            fs.unlinkSync(recording.filepath);
          }
        }
      }

      streamStates.delete(userId);
    }
  } catch (err) {
    console.error(`[WATCH] Error checking ${userId}:`, err.message);
  }
}

async function checkAllFavorites() {
  try {
    console.log('[WATCH] Checking favorites for live streams...');
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const data = await api.getFavorites(page);
      if (!data || !data.result) break;

      totalPages = data.result.totalPage || 1;
      const list = data.result.list || [];

      for (const user of list) {
        if (user.liveData && user.liveData.isLive === 1) {
          await checkUser(user.account);
        }
      }

      page++;
    }
  } catch (err) {
    console.error('[WATCH] Error checking favorites:', err.message);
  }
}

async function pollLoop() {
  const watchList = config.facecast.watchList || [];
  const interval = (config.facecast.pollInterval || 30) * 1000;

  console.log('========================================');
  console.log(' BuzzCast Private Stream Recorder');
  console.log('========================================');
  console.log(`User ID: ${config.facecast.userId}`);
  console.log(`Only Private: ${config.facecast.onlyPrivate}`);
  console.log(`Watch List: ${watchList.length > 0 ? watchList.join(', ') : 'All favorites'}`);
  console.log(`Poll Interval: ${config.facecast.pollInterval}s`);
  console.log(`Max Duration: ${config.recording.maxDuration}s`);
  console.log(`Output Dir: ${path.resolve(config.recording.outputDir || './recordings')}`);
  console.log(`Telegram Chat: ${config.telegram.chatId}`);
  console.log('========================================');

  await telegram.sendMessage('🟢 BuzzCast Recorder démarré\n\nSurveillance des streams privés en cours...');

  while (true) {
    try {
      if (watchList.length > 0) {
        // Check specific users
        for (const userId of watchList) {
          await checkUser(userId);
        }
      } else {
        // Check all favorites
        await checkAllFavorites();
      }

      // Also re-check users currently being recorded (detect stream end)
      for (const [userId, state] of streamStates.entries()) {
        if (state.live) {
          await checkUser(userId);
        }
      }
    } catch (err) {
      console.error('[MAIN] Poll error:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[MAIN] Shutting down...');
  const recordings = await recorder.stopAll();
  for (const recording of recordings) {
    if (recording && fs.existsSync(recording.filepath)) {
      const stat = fs.statSync(recording.filepath);
      if (stat.size > 100000) {
        console.log(`[MAIN] Sending last recording: ${recording.filename}`);
        await telegram.sendRecording(recording.filepath, recording.userId, recording.nickName, true);
      }
    }
  }
  await telegram.sendMessage('🔴 BuzzCast Recorder arrêté');
  process.exit(0);
});

pollLoop();
