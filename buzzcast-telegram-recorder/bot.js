const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

// ============================================================
//  USAGE:  BOT_TOKEN=ton_token node bot.js
//  Le chat ID admin est auto-detecte au premier /start
// ============================================================
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const RECORDINGS_DIR = path.join(__dirname, 'recordings');
fs.ensureDirSync(RECORDINGS_DIR);

// ============================================================
//  FACECAST API (tout integre, pas de fichier externe)
// ============================================================
const FC_BASE = 'https://dhcxzil.facecast.xyz/faceshow';
const FC_LIVE = 'https://live.facecast.xyz/live';
const rndSlash = () => '/'.repeat(Math.floor(Math.random() * 10));

const fc = {
  api: null, // { userId, token }

  async login(email, pwd) {
    const res = await axios.post(`${FC_BASE}/api/sys/login/v2`, null, {
      params: { deviceId: '214035648725148', email, pwd, type: 2 }
    });
    const d = res.data;
    if (d.code === '40007' || d.msg !== 'Login successfully') throw new Error(d.msg || 'Login failed');
    return { userId: String(d.result.userId), token: d.result.token, nickName: d.result.nickName || '' };
  },

  async userInfo(uid) {
    const res = await axios.post(`${FC_BASE}/tokens/PersonalHome/${rndSlash()}findHomeUserInfo?userId=${uid}`, null, {
      params: { systoken: this.api.token, userId: uid }
    });
    return res.data;
  },

  async liveInfo(uid) {
    const res = await axios.get(`${FC_BASE}/tokens/ranking/v2/getLastLiveInfoByUserId?liveUserId=${uid}`);
    return res.data;
  },

  async favorites(page = 1) {
    const res = await axios.post(`${FC_BASE}/user/attention/${rndSlash()}listAttention`, null, {
      params: { systoken: this.api.token, userId: this.api.userId, currPage: page, pageSize: 20, types: 0 }
    });
    return res.data;
  },

  isLive(info) { try { return info.result.isLive === 1; } catch { return false; } },
  isPrivate(info) {
    try { const r = info.result; return r.liveData.flv_url !== '' && r.isLive === 0; } catch { return false; }
  },
  nick(info) { try { return info.result.nickName; } catch { return '?'; } },
  streamId(info) { try { return info.result.streamId; } catch { return null; } },
  flvUrl(sid) { return `${FC_LIVE}/${sid}.flv`; }
};

// ============================================================
//  STATE
// ============================================================
let adminChatId = process.env.ADMIN_CHAT_ID || '';
let watchList = new Map();
let streams = new Map();
let pollInterval = 30;
let onlyPrivate = true;
let monitoring = false;
let pollTimer = null;
let configState = {};
let activeDownloads = new Map(); // userId -> { controller, filepath }

// ============================================================
//  TELEGRAM HELPERS
// ============================================================
let offset = 0;

async function poll() {
  while (true) {
    try {
      const res = await axios.get(`${TG}/getUpdates`, { params: { offset, timeout: 30 }, timeout: 35000 });
      for (const u of (res.data.result || [])) {
        offset = u.update_id + 1;
        if (u.message) await onMsg(u.message);
        else if (u.callback_query) await onCb(u.callback_query);
      }
    } catch (e) {
      if (e.code !== 'ECONNABORTED') console.error('[TG]', e.message);
      await sleep(3000);
    }
  }
}

async function send(chatId, text, opts = {}) {
  try {
    return (await axios.post(`${TG}/sendMessage`, { chat_id: chatId, text, parse_mode: 'HTML', ...opts })).data.result;
  } catch (e) { console.error('[TG] send:', e.message); }
}

async function sendFile(chatId, filepath, caption) {
  const stat = fs.statSync(filepath);
  const mb = stat.size / 1048576;
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) form.append('caption', caption.substring(0, 1024));

  const method = mb > 50 ? 'sendDocument' : 'sendVideo';
  const field = mb > 50 ? 'document' : 'video';
  form.append(field, fs.createReadStream(filepath));

  try {
    await axios.post(`${TG}/${method}`, form, {
      headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 600000
    });
  } catch {
    if (method === 'sendVideo') {
      const f2 = new FormData();
      f2.append('chat_id', String(chatId));
      if (caption) f2.append('caption', caption.substring(0, 1024));
      f2.append('document', fs.createReadStream(filepath));
      await axios.post(`${TG}/sendDocument`, f2, {
        headers: f2.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 600000
      });
    }
  }
}

async function delMsg(chatId, msgId) {
  try { await axios.post(`${TG}/deleteMessage`, { chat_id: chatId, message_id: msgId }); } catch {}
}

async function ansCb(id) {
  try { await axios.post(`${TG}/answerCallbackQuery`, { callback_query_id: id }); } catch {}
}

// ============================================================
//  STREAM DOWNLOAD (pur HTTP, pas de ffmpeg)
// ============================================================

function startDownload(userId, nickName, streamId) {
  if (activeDownloads.has(userId)) return null;

  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `BC-${userId}-${nickName}-${streamId}-${ts}.flv`;
  const filepath = path.join(RECORDINGS_DIR, filename);
  const url = fc.flvUrl(streamId);

  const controller = new AbortController();

  const download = async () => {
    try {
      const res = await axios.get(url, {
        responseType: 'stream',
        signal: controller.signal,
        timeout: 0 // pas de timeout pour le streaming
      });
      const writer = fs.createWriteStream(filepath);
      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        res.data.on('error', reject);
      });
    } catch (e) {
      if (e.code !== 'ERR_CANCELED') console.log(`[DL] ${userId} ended:`, e.message);
    }
  };

  download();
  activeDownloads.set(userId, { controller, filepath, filename });
  return { filepath, filename };
}

function stopDownload(userId) {
  const dl = activeDownloads.get(userId);
  if (!dl) return null;
  dl.controller.abort();
  activeDownloads.delete(userId);
  return dl;
}

// ============================================================
//  MESSAGE HANDLER
// ============================================================

async function onMsg(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  // Auto-detect admin
  if (!adminChatId) {
    adminChatId = String(chatId);
    console.log(`[BOT] Admin set: ${adminChatId}`);
  }

  if (String(chatId) !== String(adminChatId)) { await send(chatId, 'Acces refuse.'); return; }

  // Config/login flow
  if (configState[chatId]) { await configStep(chatId, text, msg.message_id); return; }

  const [cmd, ...rest] = text.split(' ');
  const args = rest.join(' ').trim();

  switch (cmd.toLowerCase()) {
    case '/start': case '/help': return help(chatId);
    case '/login': return loginStart(chatId);
    case '/config': return configStart(chatId);
    case '/watch': return watch(chatId, args);
    case '/unwatch': return unwatch(chatId, args);
    case '/list': return list(chatId);
    case '/favorites': return favs(chatId);
    case '/go': return go(chatId);
    case '/stop': return stop(chatId);
    case '/status': return status(chatId);
    case '/private':
      onlyPrivate = !onlyPrivate;
      return send(chatId, `Mode prives: <b>${onlyPrivate ? 'ON' : 'OFF'}</b>`);
    case '/interval':
      if (args && !isNaN(args)) {
        pollInterval = Math.max(10, parseInt(args));
        if (monitoring) { clearInterval(pollTimer); startPoll(); }
        return send(chatId, `Intervalle: <b>${pollInterval}s</b>`);
      }
      return send(chatId, `Actuel: ${pollInterval}s\nUsage: /interval 30`);
    default:
      if (/^\d{4,}$/.test(text)) return watch(chatId, text);
      return help(chatId);
  }
}

async function onCb(q) {
  const chatId = q.message.chat.id;
  await ansCb(q.id);
  if (q.data === 'go') go(chatId);
  else if (q.data === 'stop') stop(chatId);
  else if (q.data === 'list') list(chatId);
  else if (q.data === 'tp') { onlyPrivate = !onlyPrivate; send(chatId, `Prives: <b>${onlyPrivate ? 'ON' : 'OFF'}</b>`); }
}

// ============================================================
//  COMMANDS
// ============================================================

function help(chatId) {
  return send(chatId, `<b>🔴 BuzzCast Recorder</b>

Enregistre les streams prives et te les envoie ici.

<b>⚙️ Setup:</b>
/login - Connexion email + mdp
/watch &lt;id&gt; - Surveiller un broadcaster
/favorites - Charger tes favoris

<b>▶️ Controle:</b>
/go - Demarrer
/stop - Arreter
/status - Etat
/list - Watchlist

<b>🔧 Options:</b>
/private - Prives uniquement (${onlyPrivate ? 'ON' : 'OFF'})
/interval &lt;sec&gt; - Intervalle (${pollInterval}s)

<i>Envoie un ID direct pour l'ajouter.</i>`, {
    reply_markup: JSON.stringify({ inline_keyboard: [[
      { text: monitoring ? '⏹ Stop' : '▶️ Go', callback_data: monitoring ? 'stop' : 'go' },
      { text: '📋 Liste', callback_data: 'list' },
      { text: onlyPrivate ? '🔒 Prives' : '🔓 Tout', callback_data: 'tp' }
    ]]})
  });
}

function loginStart(chatId) {
  configState[chatId] = { step: 'email' };
  return send(chatId, `<b>🔐 Login BuzzCast</b>\n\nEnvoie ton <b>email</b>:\n\n/cancel pour annuler`);
}

function configStart(chatId) {
  configState[chatId] = { step: 'userId' };
  return send(chatId, `<b>Config manuelle</b>\n\nEnvoie ton <b>User ID</b>:\n\n/cancel pour annuler`);
}

async function configStep(chatId, text, msgId) {
  const s = configState[chatId];
  if (text === '/cancel') { delete configState[chatId]; return send(chatId, 'Annule.'); }

  // LOGIN FLOW
  if (s.step === 'email') {
    s.email = text;
    s.step = 'password';
    return send(chatId, `Email: <b>${text}</b>\n\nEnvoie ton <b>mot de passe</b>:`);
  }
  if (s.step === 'password') {
    delMsg(chatId, msgId); // supprime le mdp du chat
    await send(chatId, '⏳ Connexion...');
    try {
      const r = await fc.login(s.email, text);
      fc.api = { userId: r.userId, token: r.token };
      delete configState[chatId];
      return send(chatId, `✅ <b>Connecte!</b>\n\n👤 <b>${r.nickName}</b>\nID: <code>${r.userId}</code>\n\n/favorites pour charger tes favs\n/go pour demarrer`);
    } catch (e) {
      delete configState[chatId];
      return send(chatId, `❌ Echec: ${e.message}\n\n/login pour reessayer`);
    }
  }

  // MANUAL CONFIG FLOW
  if (s.step === 'userId') {
    s.userId = text;
    s.step = 'token';
    return send(chatId, `ID: <b>${text}</b>\n\nEnvoie ton <b>token</b>:`);
  }
  if (s.step === 'token') {
    fc.api = { userId: s.userId, token: text };
    delete configState[chatId];
    try {
      const info = await fc.userInfo(s.userId);
      return send(chatId, `✅ Connecte: <b>${fc.nick(info)}</b>\n\n/favorites ou /go`);
    } catch (e) {
      return send(chatId, `⚠️ Sauve mais test echoue: ${e.message}`);
    }
  }
}

async function watch(chatId, uid) {
  if (!uid) return send(chatId, 'Usage: /watch &lt;userId&gt;');
  uid = uid.trim();
  if (watchList.has(uid)) return send(chatId, 'Deja dans la liste.');
  let nick = uid;
  if (fc.api) { try { nick = fc.nick(await fc.userInfo(uid)); } catch {} }
  watchList.set(uid, { nickName: nick });
  return send(chatId, `✅ <b>${nick}</b> (${uid}) ajoute\nTotal: ${watchList.size}`);
}

async function unwatch(chatId, uid) {
  if (!uid) return send(chatId, 'Usage: /unwatch &lt;userId&gt;');
  uid = uid.trim();
  if (!watchList.delete(uid)) return send(chatId, 'Pas dans la liste.');
  if (streams.has(uid)) { stopDownload(uid); streams.delete(uid); }
  return send(chatId, `❌ ${uid} retire. Total: ${watchList.size}`);
}

async function list(chatId) {
  if (!watchList.size) return send(chatId, 'Liste vide. /watch ou /favorites');
  let t = `<b>📋 Watchlist (${watchList.size})</b>\n\n`;
  for (const [uid, d] of watchList) {
    const s = streams.get(uid);
    const i = s?.recording ? '🔴' : s?.live ? '🟢' : '⚫';
    t += `${i} <b>${d.nickName}</b> (${uid})\n`;
  }
  return send(chatId, t);
}

async function favs(chatId) {
  if (!fc.api) return send(chatId, '/login d\'abord');
  await send(chatId, '⏳ Chargement...');
  try {
    let p = 1, tp = 1, n = 0;
    while (p <= tp) {
      const d = await fc.favorites(p);
      if (!d?.result) break;
      tp = d.result.totalPage || 1;
      for (const u of (d.result.list || [])) {
        const a = String(u.account || u.userId || '');
        if (a && !watchList.has(a)) { watchList.set(a, { nickName: u.nick_name || u.nickName || a }); n++; }
      }
      p++;
    }
    return send(chatId, `✅ <b>${n}</b> favoris ajoutes\nTotal: <b>${watchList.size}</b>\n\n/go pour demarrer`);
  } catch (e) { return send(chatId, `❌ ${e.message}`); }
}

async function go(chatId) {
  if (!fc.api) return send(chatId, '/login d\'abord');
  if (!watchList.size) return send(chatId, 'Liste vide! /watch ou /favorites');
  if (monitoring) return send(chatId, 'Deja en cours! /stop');
  monitoring = true;
  startPoll();
  return send(chatId, `▶️ <b>Surveillance ON</b>\n\n${watchList.size} broadcasters\nIntervalle: ${pollInterval}s\nMode: ${onlyPrivate ? '🔒 prives' : '🔓 tous'}`);
}

async function stop(chatId) {
  if (!monitoring) return send(chatId, 'Pas en cours.');
  monitoring = false;
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  for (const [uid, s] of streams) { if (s.recording) stopDownload(uid); }
  streams.clear();
  return send(chatId, '⏹ <b>Surveillance OFF</b>');
}

async function status(chatId) {
  let t = `<b>📊 Status</b>\n\n`;
  t += `Surveillance: ${monitoring ? '🟢' : '🔴'}\nMode: ${onlyPrivate ? '🔒' : '🔓'}\nIntervalle: ${pollInterval}s\nWatchlist: ${watchList.size}\nAPI: ${fc.api ? '✅' : '❌'}\n\n`;
  let r = 0;
  for (const [, s] of streams) {
    if (s.recording) { r++; t += `🔴 <b>${s.nickName}</b> - ${Math.floor((Date.now() - s.start) / 60000)}min\n`; }
  }
  if (!r) t += 'Aucun enregistrement.';
  return send(chatId, t);
}

// ============================================================
//  POLL LOOP
// ============================================================

function startPoll() {
  pollStreams();
  pollTimer = setInterval(() => { if (monitoring) pollStreams(); }, pollInterval * 1000);
}

async function pollStreams() {
  for (const [uid] of watchList) {
    try { await checkUser(uid); } catch (e) { console.error(`[POLL] ${uid}:`, e.message); }
  }
}

async function checkUser(userId) {
  const info = await fc.userInfo(userId);
  if (!info?.result) return;

  const nickName = fc.nick(info);
  const live = fc.isLive(info);
  const priv = fc.isPrivate(info);
  const st = streams.get(userId);

  if (watchList.has(userId)) watchList.get(userId).nickName = nickName;

  // STREAM STARTED
  if (live && (!st || !st.live)) {
    console.log(`[LIVE] ${nickName} (${userId})${priv ? ' PRIVE' : ''}`);

    if (onlyPrivate && !priv) {
      streams.set(userId, { live: true, recording: false, nickName, priv });
      return;
    }

    const li = await fc.liveInfo(userId);
    const sid = fc.streamId(li);
    if (!sid) { streams.set(userId, { live: true, recording: false, nickName, priv }); return; }

    // Verifier acces
    try {
      await axios.head(fc.flvUrl(sid), { timeout: 5000 });
    } catch {
      console.log(`[SKIP] ${nickName} - pas accessible`);
      streams.set(userId, { live: true, recording: false, nickName, priv });
      return;
    }

    const dl = startDownload(userId, nickName, sid);
    if (dl) {
      streams.set(userId, { live: true, recording: true, nickName, priv, ...dl, start: Date.now() });
      const icon = priv ? '🔒 PRIVE' : '🔴 LIVE';
      await send(adminChatId, `${icon}\n\n<b>${nickName}</b> (${userId})\n🎬 Enregistrement...`);
    }
  }

  // STREAM ENDED
  if (!live && st?.live) {
    console.log(`[OFF] ${nickName} (${userId})`);

    if (st.recording) {
      stopDownload(userId);

      // Petit delai pour que le fichier soit finalise
      await sleep(2000);

      if (st.filepath && fs.existsSync(st.filepath)) {
        const size = fs.statSync(st.filepath).size;
        const mb = (size / 1048576).toFixed(1);

        if (size > 100000) {
          const dur = Math.floor((Date.now() - st.start) / 1000);
          const m = Math.floor(dur / 60), s = dur % 60;
          const icon = st.priv ? '🔒' : '📹';

          await send(adminChatId, `⏹ <b>Stream fini</b>\n\n<b>${st.nickName}</b> (${userId})\nDuree: ${m}m${s}s | ${mb} MB\n\n⏳ Envoi...`);
          try {
            await sendFile(adminChatId, st.filepath, `${icon} ${st.nickName} (${userId}) - ${m}m${s}s`);
            await send(adminChatId, '✅ Envoye!');
          } catch (e) {
            await send(adminChatId, `❌ Erreur envoi: ${e.message}\nFichier: ${st.filename}`);
          }
        } else {
          fs.unlinkSync(st.filepath);
        }
      }
    }
    streams.delete(userId);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
//  START
// ============================================================

if (!BOT_TOKEN) {
  console.log(`
❌ BOT_TOKEN manquant!

1. Va sur Telegram, cherche @BotFather
2. Envoie /newbot et suis les etapes
3. Copie le token
4. Lance:  BOT_TOKEN=ton_token node bot.js
  `);
  process.exit(1);
}

console.log('🤖 BuzzCast Recorder Bot');
console.log(`📁 Recordings: ${RECORDINGS_DIR}`);
if (adminChatId) console.log(`👤 Admin: ${adminChatId}`);
else console.log('👤 Admin: auto-detect au premier /start');
console.log('');
console.log('Bot pret! Envoie /start sur Telegram.');

poll();
