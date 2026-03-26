const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const FormData = require('form-data');
const FacecastAPI = require('./facecast-api');

// ============================================================
//  CONFIG - Remplis ces 2 valeurs et lance: node bot.js
// ============================================================
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '';
// ============================================================

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
fs.ensureDirSync(RECORDINGS_DIR);

// State
let facecastApi = null;
let watchList = new Map();       // broadcasterId -> { nickName }
let streamStates = new Map();    // broadcasterId -> { live, recording, file, ... }
let pollInterval = 30;
let onlyPrivate = true;
let monitoring = false;
let pollTimer = null;
let configState = {};

// ============================================================
//  TELEGRAM BOT (long polling)
// ============================================================

let offset = 0;

async function pollTelegram() {
  while (true) {
    try {
      const res = await axios.get(`${TG}/getUpdates`, {
        params: { offset, timeout: 30 },
        timeout: 35000
      });
      const updates = res.data.result || [];
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) await handleMessage(update.message);
        else if (update.callback_query) await handleCallback(update.callback_query);
      }
    } catch (err) {
      if (err.code !== 'ECONNABORTED') console.error('[TG] Poll error:', err.message);
      await sleep(3000);
    }
  }
}

async function sendMsg(chatId, text, opts = {}) {
  try {
    const res = await axios.post(`${TG}/sendMessage`, { chat_id: chatId, text, parse_mode: 'HTML', ...opts });
    return res.data.result;
  } catch (err) {
    console.error('[TG] sendMsg error:', err.message);
  }
}

async function sendVideo(chatId, filepath, caption) {
  const stat = fs.statSync(filepath);
  const sizeMB = stat.size / (1024 * 1024);
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', caption.substring(0, 1024));

  if (sizeMB > 50) {
    form.append('document', fs.createReadStream(filepath));
    await axios.post(`${TG}/sendDocument`, form, {
      headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 600000
    });
  } else {
    form.append('video', fs.createReadStream(filepath));
    try {
      await axios.post(`${TG}/sendVideo`, form, {
        headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 600000
      });
    } catch {
      const form2 = new FormData();
      form2.append('chat_id', String(chatId));
      if (caption) form2.append('caption', caption.substring(0, 1024));
      form2.append('document', fs.createReadStream(filepath));
      await axios.post(`${TG}/sendDocument`, form2, {
        headers: form2.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 600000
      });
    }
  }
}

async function answerCallback(callbackId, text) {
  try { await axios.post(`${TG}/answerCallbackQuery`, { callback_query_id: callbackId, text }); } catch {}
}

// ============================================================
//  MESSAGE HANDLER
// ============================================================

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (ADMIN_CHAT_ID && String(chatId) !== String(ADMIN_CHAT_ID)) {
    await sendMsg(chatId, "Acces refuse.");
    return;
  }

  if (configState[chatId]) {
    await handleConfigStep(chatId, text);
    return;
  }

  const cmd = text.split(' ')[0].toLowerCase();
  const args = text.substring(cmd.length).trim();

  switch (cmd) {
    case '/start':
    case '/help':
      await showHelp(chatId);
      break;
    case '/config':
      await startConfig(chatId);
      break;
    case '/watch':
      await addWatch(chatId, args);
      break;
    case '/unwatch':
      await removeWatch(chatId, args);
      break;
    case '/list':
      await showList(chatId);
      break;
    case '/go':
      await startMonitoring(chatId);
      break;
    case '/stop':
      await stopMonitoring(chatId);
      break;
    case '/status':
      await showStatus(chatId);
      break;
    case '/private':
      onlyPrivate = !onlyPrivate;
      await sendMsg(chatId, `Mode prives uniquement: <b>${onlyPrivate ? 'OUI' : 'NON'}</b>`);
      break;
    case '/interval':
      if (args && !isNaN(args)) {
        pollInterval = Math.max(10, parseInt(args));
        await sendMsg(chatId, `Intervalle: <b>${pollInterval}s</b>`);
        if (monitoring) { stopPoll(); startPoll(); }
      } else {
        await sendMsg(chatId, `Intervalle actuel: <b>${pollInterval}s</b>\nUsage: /interval 30`);
      }
      break;
    case '/favorites':
      await loadFavorites(chatId);
      break;
    default:
      if (/^\d{4,}$/.test(text)) await addWatch(chatId, text);
      else await showHelp(chatId);
  }
}

async function handleCallback(query) {
  const chatId = query.message.chat.id;
  await answerCallback(query.id);
  if (query.data === 'go') await startMonitoring(chatId);
  else if (query.data === 'stop') await stopMonitoring(chatId);
  else if (query.data === 'list') await showList(chatId);
  else if (query.data === 'toggle_private') {
    onlyPrivate = !onlyPrivate;
    await sendMsg(chatId, `Mode prives uniquement: <b>${onlyPrivate ? 'OUI' : 'NON'}</b>`);
  }
}

// ============================================================
//  COMMANDS
// ============================================================

async function showHelp(chatId) {
  const text = `<b>🔴 BuzzCast Private Recorder</b>

Enregistre automatiquement les streams prives auxquels tu es invite et te les envoie ici.

<b>⚙️ Setup:</b>
/config - Tes identifiants BuzzCast
/watch &lt;userId&gt; - Surveiller un broadcaster
/favorites - Charger tes favoris BuzzCast

<b>▶️ Controle:</b>
/go - Demarrer la surveillance
/stop - Arreter
/status - Etat actuel
/list - Voir la watchlist

<b>🔧 Options:</b>
/private - Toggle prives uniquement (${onlyPrivate ? 'ON' : 'OFF'})
/interval &lt;sec&gt; - Intervalle de check (${pollInterval}s)

<i>Quand un broadcaster de ta liste lance un prive et que tu es invite, le bot enregistre le stream et te l'envoie ici!</i>`;

  await sendMsg(chatId, text, {
    reply_markup: JSON.stringify({
      inline_keyboard: [[
        { text: monitoring ? '⏹ Stop' : '▶️ Go', callback_data: monitoring ? 'stop' : 'go' },
        { text: '📋 Liste', callback_data: 'list' },
        { text: onlyPrivate ? '🔒 Prives' : '🔓 Tout', callback_data: 'toggle_private' }
      ]]
    })
  });
}

async function startConfig(chatId) {
  configState[chatId] = { step: 'userId' };
  await sendMsg(chatId, `<b>Configuration BuzzCast</b>\n\nEnvoie ton <b>User ID</b> BuzzCast:\n<i>(ton ID numerique sur l'app)</i>`);
}

async function handleConfigStep(chatId, text) {
  const state = configState[chatId];
  if (text === '/cancel') { delete configState[chatId]; await sendMsg(chatId, 'Annule.'); return; }

  if (state.step === 'userId') {
    state.userId = text;
    state.step = 'token';
    await sendMsg(chatId, `User ID: <b>${text}</b>\n\nMaintenant envoie ton <b>Token</b>:\n<i>(localStorage "myToken" dans le StreamCatcher)</i>`);
  } else if (state.step === 'token') {
    facecastApi = new FacecastAPI(state.userId, text);
    delete configState[chatId];
    try {
      const info = await facecastApi.getUserInfo(state.userId);
      const nick = info?.result?.nickName || 'inconnu';
      await sendMsg(chatId, `✅ Connecte: <b>${nick}</b> (${state.userId})\n\n/favorites pour charger tes favoris\n/watch &lt;id&gt; pour ajouter un user\nPuis /go pour demarrer!`);
    } catch (err) {
      await sendMsg(chatId, `⚠️ Config sauvee mais test echoue: ${err.message}\nVerifie avec /config`);
    }
  }
}

async function addWatch(chatId, userId) {
  if (!userId) { await sendMsg(chatId, 'Usage: /watch &lt;userId&gt;'); return; }
  userId = userId.trim();
  if (watchList.has(userId)) { await sendMsg(chatId, `Deja dans la liste.`); return; }

  let nickName = userId;
  if (facecastApi) {
    try {
      const info = await facecastApi.getUserInfo(userId);
      if (info?.result?.nickName) nickName = info.result.nickName;
    } catch {}
  }
  watchList.set(userId, { nickName });
  await sendMsg(chatId, `✅ Ajoute: <b>${nickName}</b> (${userId})\nTotal: ${watchList.size}`);
}

async function removeWatch(chatId, userId) {
  if (!userId) { await sendMsg(chatId, 'Usage: /unwatch &lt;userId&gt;'); return; }
  userId = userId.trim();
  if (watchList.delete(userId)) {
    if (streamStates.has(userId)) { await stopRecording(userId); streamStates.delete(userId); }
    await sendMsg(chatId, `❌ Retire: ${userId}\nTotal: ${watchList.size}`);
  } else {
    await sendMsg(chatId, `Pas dans la liste.`);
  }
}

async function showList(chatId) {
  if (watchList.size === 0) { await sendMsg(chatId, 'Liste vide. /watch ou /favorites'); return; }
  let text = `<b>📋 Watchlist (${watchList.size})</b>\n\n`;
  for (const [uid, data] of watchList) {
    const s = streamStates.get(uid);
    let icon = '⚫';
    if (s?.recording) icon = '🔴 REC';
    else if (s?.live) icon = '🟢';
    text += `${icon} <b>${data.nickName}</b> (${uid})\n`;
  }
  await sendMsg(chatId, text);
}

async function loadFavorites(chatId) {
  if (!facecastApi) { await sendMsg(chatId, '/config d\'abord'); return; }
  await sendMsg(chatId, '⏳ Chargement des favoris...');
  try {
    let page = 1, totalPages = 1, added = 0;
    while (page <= totalPages) {
      const data = await facecastApi.getFavorites(page);
      if (!data?.result) break;
      totalPages = data.result.totalPage || 1;
      for (const user of (data.result.list || [])) {
        const account = String(user.account || user.userId || '');
        if (account && !watchList.has(account)) {
          watchList.set(account, { nickName: user.nick_name || user.nickName || account });
          added++;
        }
      }
      page++;
    }
    await sendMsg(chatId, `✅ <b>${added}</b> favoris ajoutes\nTotal: <b>${watchList.size}</b>\n\n/go pour demarrer`);
  } catch (err) {
    await sendMsg(chatId, `❌ Erreur: ${err.message}`);
  }
}

async function startMonitoring(chatId) {
  if (!facecastApi) { await sendMsg(chatId, '/config d\'abord'); return; }
  if (watchList.size === 0) { await sendMsg(chatId, 'Liste vide! /watch ou /favorites'); return; }
  if (monitoring) { await sendMsg(chatId, 'Deja en cours! /stop pour arreter'); return; }

  monitoring = true;
  await sendMsg(chatId, `▶️ <b>Surveillance ON</b>\n\n${watchList.size} broadcasters surveilles\nIntervalle: ${pollInterval}s\nMode: ${onlyPrivate ? '🔒 prives uniquement' : '🔓 tous'}\n\n<i>Tu recevras une notif + l'enregistrement quand un prive demarre et se termine.</i>`);
  startPoll();
}

async function stopMonitoring(chatId) {
  if (!monitoring) { await sendMsg(chatId, 'Pas en cours.'); return; }
  monitoring = false;
  stopPoll();
  for (const [userId, state] of streamStates) {
    if (state.recording) await stopRecording(userId);
  }
  streamStates.clear();
  await sendMsg(chatId, '⏹ <b>Surveillance OFF</b>');
}

async function showStatus(chatId) {
  let text = `<b>📊 Status</b>\n\n`;
  text += `Surveillance: ${monitoring ? '🟢 Active' : '🔴 Off'}\n`;
  text += `Mode: ${onlyPrivate ? '🔒 Prives' : '🔓 Tous'}\n`;
  text += `Intervalle: ${pollInterval}s\n`;
  text += `Watchlist: ${watchList.size}\n`;
  text += `API: ${facecastApi ? '✅' : '❌'}\n\n`;

  let recCount = 0;
  for (const [uid, s] of streamStates) {
    if (s.recording) {
      recCount++;
      const mins = Math.floor((Date.now() - s.startTime) / 60000);
      text += `🔴 <b>${s.nickName}</b> - ${mins}min\n`;
    }
  }
  if (recCount === 0) text += 'Aucun enregistrement en cours.';
  await sendMsg(chatId, text);
}

// ============================================================
//  MONITORING LOOP
// ============================================================

function startPoll() {
  pollStreams().catch(err => console.error('[POLL]', err.message));
  pollTimer = setInterval(() => {
    if (monitoring) pollStreams().catch(err => console.error('[POLL]', err.message));
  }, pollInterval * 1000);
}

function stopPoll() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

async function pollStreams() {
  for (const [userId] of watchList) {
    try { await checkUser(userId); } catch (err) {
      console.error(`[POLL] ${userId}:`, err.message);
    }
  }
}

async function checkUser(userId) {
  const userInfo = await facecastApi.getUserInfo(userId);
  if (!userInfo?.result) return;

  const nickName = userInfo.result.nickName || userId;
  const isLive = facecastApi.isLive(userInfo);
  const isPrivate = facecastApi.isPrivateStream(userInfo);
  const state = streamStates.get(userId);

  if (watchList.has(userId)) watchList.get(userId).nickName = nickName;

  // Stream vient de demarrer
  if (isLive && (!state || !state.live)) {
    console.log(`[LIVE] ${nickName} (${userId})${isPrivate ? ' PRIVE' : ''}`);

    // Si mode prive uniquement et pas prive -> skip
    if (onlyPrivate && !isPrivate) {
      streamStates.set(userId, { live: true, recording: false, nickName, isPrivate });
      return;
    }

    // Verifier qu'on a acces au stream (= on est invite pour les prives)
    const liveInfo = await facecastApi.getLiveInfo(userId);
    const streamId = liveInfo?.result?.streamId;
    if (!streamId) {
      console.log(`[SKIP] ${nickName} - pas de streamId (pas invite?)`);
      streamStates.set(userId, { live: true, recording: false, nickName, isPrivate });
      return;
    }

    const urls = facecastApi.getStreamUrls(streamId);

    // Verifier que le stream FLV est accessible
    try {
      const check = await axios.head(urls.flv, { timeout: 5000 });
      if (check.status !== 200) throw new Error('not 200');
    } catch {
      console.log(`[SKIP] ${nickName} - stream non accessible (pas invite)`);
      streamStates.set(userId, { live: true, recording: false, nickName, isPrivate });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `BuzzCast-${userId}-${nickName}-${streamId}-${timestamp}.flv`;
    const filepath = path.join(RECORDINGS_DIR, filename);

    // Enregistrer avec ffmpeg
    const proc = spawn('ffmpeg', [
      '-y', '-i', urls.flv, '-c', 'copy', '-t', '7200', filepath
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    proc.on('error', err => console.error(`[REC] ffmpeg error ${userId}:`, err.message));
    proc.on('close', () => console.log(`[REC] ffmpeg closed ${userId}`));

    streamStates.set(userId, {
      live: true, recording: true, nickName, isPrivate,
      filepath, filename, proc, startTime: Date.now()
    });

    const type = isPrivate ? '🔒 PRIVE' : '🔴 LIVE';
    await sendMsg(ADMIN_CHAT_ID, `${type}\n\n<b>${nickName}</b> (${userId})\n\n🎬 Enregistrement en cours...\nFichier: <code>${filename}</code>`);
  }

  // Stream termine
  if (!isLive && state?.live) {
    console.log(`[OFFLINE] ${nickName} (${userId})`);

    if (state.recording && state.proc) {
      await stopRecording(userId);

      if (state.filepath && fs.existsSync(state.filepath)) {
        const stat = fs.statSync(state.filepath);
        const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);

        if (stat.size > 100000) { // > 100KB
          const duration = Math.floor((Date.now() - state.startTime) / 1000);
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          const type = state.isPrivate ? '🔒 Prive' : '📹 Live';

          await sendMsg(ADMIN_CHAT_ID, `⏹ <b>Stream termine</b>\n\n<b>${state.nickName}</b> (${userId})\nDuree: ${mins}m ${secs}s\nTaille: ${sizeMB} MB\n\n⏳ Envoi en cours...`);

          try {
            const caption = `${type} - ${state.nickName} (${userId})\nDuree: ${mins}m ${secs}s | ${sizeMB} MB`;
            await sendVideo(ADMIN_CHAT_ID, state.filepath, caption);
            await sendMsg(ADMIN_CHAT_ID, `✅ Enregistrement envoye!`);
          } catch (err) {
            await sendMsg(ADMIN_CHAT_ID, `❌ Erreur envoi: ${err.message}\nFichier local: ${state.filename}`);
          }
        } else {
          fs.unlinkSync(state.filepath);
        }
      }
    }
    streamStates.delete(userId);
  }
}

async function stopRecording(userId) {
  const state = streamStates.get(userId);
  if (!state?.proc) return;
  return new Promise(resolve => {
    state.proc.stdin.write('q');
    state.proc.on('close', () => resolve());
    setTimeout(() => { try { state.proc.kill('SIGKILL'); } catch {} resolve(); }, 10000);
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  STARTUP
// ============================================================

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN manquant!');
  console.error('');
  console.error('1. Cree un bot via @BotFather sur Telegram');
  console.error('2. Lance: BOT_TOKEN=xxx ADMIN_CHAT_ID=yyy node bot.js');
  process.exit(1);
}

if (!ADMIN_CHAT_ID) {
  console.error('❌ ADMIN_CHAT_ID manquant!');
  console.error('');
  console.error('1. Envoie /start a @userinfobot pour avoir ton chat ID');
  console.error('2. Lance: BOT_TOKEN=xxx ADMIN_CHAT_ID=yyy node bot.js');
  process.exit(1);
}

console.log('========================================');
console.log(' BuzzCast Telegram Recorder Bot');
console.log('========================================');
console.log(`Admin: ${ADMIN_CHAT_ID}`);
console.log(`Recordings: ${RECORDINGS_DIR}`);
console.log('========================================');

pollTelegram();
