#!/bin/bash
# =========================================
#  BuzzCast Telegram Recorder - Install VPS
#  Colle ce script sur ton VPS et c'est tout
# =========================================

set -e

echo "🔧 Installation..."

# Node.js
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "✅ Node $(node -v)"

# Dossier
mkdir -p /root/buzzcast-bot/recordings
cd /root/buzzcast-bot

# package.json
cat > package.json << 'PKGJSON'
{
  "name": "buzzcast-telegram-recorder",
  "version": "1.0.0",
  "dependencies": {
    "axios": "^1.7.0",
    "form-data": "^4.0.0",
    "fs-extra": "^11.2.0"
  }
}
PKGJSON

# bot.js
cat > bot.js << 'BOTJS'
const axios=require("axios"),fs=require("fs-extra"),path=require("path"),FormData=require("form-data");
const BOT_TOKEN=process.env.BOT_TOKEN||"";
const TG=`https://api.telegram.org/bot${BOT_TOKEN}`;
const DIR=path.join(__dirname,"recordings");fs.ensureDirSync(DIR);
const FC="https://dhcxzil.facecast.xyz/faceshow",FLV="https://live.facecast.xyz/live";
const rs=()=>"/".repeat(Math.floor(Math.random()*10));
const fc={api:null,
async login(e,p){const r=await axios.post(`${FC}/api/sys/login/v2`,null,{params:{deviceId:"214035648725148",email:e,pwd:p,type:2}});const d=r.data;if(d.code==="40007"||d.msg!=="Login successfully")throw new Error(d.msg||"Login failed");return{userId:String(d.result.userId),token:d.result.token,nickName:d.result.nickName||""}},
async ui(u){return(await axios.post(`${FC}/tokens/PersonalHome/${rs()}findHomeUserInfo?userId=${u}`,null,{params:{systoken:this.api.token,userId:u}})).data},
async li(u){return(await axios.get(`${FC}/tokens/ranking/v2/getLastLiveInfoByUserId?liveUserId=${u}`)).data},
async fav(p=1){return(await axios.post(`${FC}/user/attention/${rs()}listAttention`,null,{params:{systoken:this.api.token,userId:this.api.userId,currPage:p,pageSize:20,types:0}})).data},
isL(i){try{return i.result.isLive===1}catch{return false}},
isP(i){try{const r=i.result;return r.liveData.flv_url!==""&&r.isLive===0}catch{return false}},
nn(i){try{return i.result.nickName}catch{return"?"}},
sid(i){try{return i.result.streamId}catch{return null}},
flu(s){return`${FLV}/${s}.flv`}};
let adm=process.env.ADMIN_CHAT_ID||"",wl=new Map,st=new Map,pi=30,op=true,mon=false,pt=null,cs={},dl=new Map,off=0;
async function poll(){while(true){try{const r=await axios.get(`${TG}/getUpdates`,{params:{offset:off,timeout:30},timeout:35000});for(const u of(r.data.result||[])){off=u.update_id+1;if(u.message)await onM(u.message);else if(u.callback_query)await onC(u.callback_query)}}catch(e){if(e.code!=="ECONNABORTED")console.error("[TG]",e.message);await sl(3000)}}}
async function snd(c,t,o={}){try{return(await axios.post(`${TG}/sendMessage`,{chat_id:c,text:t,parse_mode:"HTML",...o})).data.result}catch(e){console.error("[TG]",e.message)}}
async function sf(c,f,cap){const s=fs.statSync(f).size,mb=s/1048576,fm=new FormData;fm.append("chat_id",String(c));if(cap)fm.append("caption",cap.substring(0,1024));const m=mb>50?"sendDocument":"sendVideo",fd=mb>50?"document":"video";fm.append(fd,fs.createReadStream(f));try{await axios.post(`${TG}/${m}`,fm,{headers:fm.getHeaders(),maxContentLength:Infinity,maxBodyLength:Infinity,timeout:600000})}catch{if(m==="sendVideo"){const f2=new FormData;f2.append("chat_id",String(c));if(cap)f2.append("caption",cap.substring(0,1024));f2.append("document",fs.createReadStream(f));await axios.post(`${TG}/sendDocument`,f2,{headers:f2.getHeaders(),maxContentLength:Infinity,maxBodyLength:Infinity,timeout:600000})}}}
async function dm(c,i){try{await axios.post(`${TG}/deleteMessage`,{chat_id:c,message_id:i})}catch{}}
async function ac(i){try{await axios.post(`${TG}/answerCallbackQuery`,{callback_query_id:i})}catch{}}
function sdl(uid,nn,sid){if(dl.has(uid))return null;const ts=new Date().toISOString().replace(/[:.]/g,"-").substring(0,19),fn=`BC-${uid}-${nn}-${sid}-${ts}.flv`,fp=path.join(DIR,fn),ct=new AbortController;(async()=>{try{const r=await axios.get(fc.flu(sid),{responseType:"stream",signal:ct.signal,timeout:0});const w=fs.createWriteStream(fp);r.data.pipe(w);await new Promise((ok,no)=>{w.on("finish",ok);w.on("error",no);r.data.on("error",no)})}catch(e){if(e.code!=="ERR_CANCELED")console.log(`[DL] ${uid}:`,e.message)}})();dl.set(uid,{controller:ct,filepath:fp,filename:fn});return{filepath:fp,filename:fn}}
function xdl(uid){const d=dl.get(uid);if(!d)return null;d.controller.abort();dl.delete(uid);return d}
async function onM(msg){const c=msg.chat.id,t=(msg.text||"").trim();if(!adm){adm=String(c);console.log(`[BOT] Admin: ${adm}`)}if(String(c)!==String(adm)){await snd(c,"Acces refuse.");return}if(cs[c]){await cfs(c,t,msg.message_id);return}const[cmd,...rest]=t.split(" ");const a=rest.join(" ").trim();switch(cmd.toLowerCase()){case"/start":case"/help":return help(c);case"/login":return lgs(c);case"/config":cs[c]={step:"userId"};return snd(c,"<b>Config manuelle</b>\n\nEnvoie ton <b>User ID</b>:\n/cancel pour annuler");case"/watch":return wa(c,a);case"/unwatch":return uw(c,a);case"/list":return li(c);case"/favorites":return fvs(c);case"/go":return go(c);case"/stop":return stp(c);case"/status":return sts(c);case"/private":op=!op;return snd(c,`Prives: <b>${op?"ON":"OFF"}</b>`);case"/interval":if(a&&!isNaN(a)){pi=Math.max(10,parseInt(a));if(mon){clearInterval(pt);spoll();}return snd(c,`Intervalle: <b>${pi}s</b>`)}return snd(c,`Actuel: ${pi}s\n/interval 30`);default:if(/^\d{4,}$/.test(t))return wa(c,t);return help(c)}}
async function onC(q){const c=q.message.chat.id;await ac(q.id);if(q.data==="go")go(c);else if(q.data==="stop")stp(c);else if(q.data==="list")li(c);else if(q.data==="tp"){op=!op;snd(c,`Prives: <b>${op?"ON":"OFF"}</b>`)}}
function help(c){return snd(c,`<b>🔴 BuzzCast Recorder</b>\n\nEnregistre les streams prives et te les envoie ici.\n\n<b>⚙️ Setup:</b>\n/login - Connexion email + mdp\n/watch <id> - Surveiller un broadcaster\n/favorites - Charger tes favoris\n\n<b>▶️ Controle:</b>\n/go - Demarrer\n/stop - Arreter\n/status - Etat\n/list - Watchlist\n\n<b>🔧 Options:</b>\n/private - Prives uniquement (${op?"ON":"OFF"})\n/interval <sec> - Intervalle (${pi}s)\n\n<i>Envoie un ID direct pour l'ajouter.</i>`,{reply_markup:JSON.stringify({inline_keyboard:[[{text:mon?"⏹ Stop":"▶️ Go",callback_data:mon?"stop":"go"},{text:"📋 Liste",callback_data:"list"},{text:op?"🔒 Prives":"🔓 Tout",callback_data:"tp"}]]})})}
function lgs(c){cs[c]={step:"email"};return snd(c,"<b>🔐 Login BuzzCast</b>\n\nEnvoie ton <b>email</b>:\n/cancel pour annuler")}
async function cfs(c,t,mid){const s=cs[c];if(t==="/cancel"){delete cs[c];return snd(c,"Annule.")}if(s.step==="email"){s.email=t;s.step="pwd";return snd(c,`Email: <b>${t}</b>\n\nEnvoie ton <b>mot de passe</b>:`)}if(s.step==="pwd"){dm(c,mid);await snd(c,"⏳ Connexion...");try{const r=await fc.login(s.email,t);fc.api={userId:r.userId,token:r.token};delete cs[c];return snd(c,`✅ <b>Connecte!</b>\n\n👤 <b>${r.nickName}</b>\nID: <code>${r.userId}</code>\n\n/favorites puis /go`)}catch(e){delete cs[c];return snd(c,`❌ ${e.message}\n/login pour reessayer`)}}if(s.step==="userId"){s.userId=t;s.step="token";return snd(c,`ID: <b>${t}</b>\nEnvoie ton <b>token</b>:`)}if(s.step==="token"){fc.api={userId:s.userId,token:t};delete cs[c];try{const i=await fc.ui(s.userId);return snd(c,`✅ <b>${fc.nn(i)}</b>\n/favorites ou /go`)}catch(e){return snd(c,`⚠️ ${e.message}`)}}}
async function wa(c,uid){if(!uid)return snd(c,"/watch <userId>");uid=uid.trim();if(wl.has(uid))return snd(c,"Deja dans la liste.");let n=uid;if(fc.api)try{n=fc.nn(await fc.ui(uid))}catch{}wl.set(uid,{nn:n});return snd(c,`✅ <b>${n}</b> (${uid})\nTotal: ${wl.size}`)}
async function uw(c,uid){if(!uid)return snd(c,"/unwatch <userId>");uid=uid.trim();if(!wl.delete(uid))return snd(c,"Pas dans la liste.");if(st.has(uid)){xdl(uid);st.delete(uid)}return snd(c,`❌ ${uid} retire. Total: ${wl.size}`)}
async function li(c){if(!wl.size)return snd(c,"Vide. /watch ou /favorites");let t=`<b>📋 Watchlist (${wl.size})</b>\n\n`;for(const[u,d]of wl){const s=st.get(u);t+=`${s?.rec?"🔴":s?.live?"🟢":"⚫"} <b>${d.nn}</b> (${u})\n`}return snd(c,t)}
async function fvs(c){if(!fc.api)return snd(c,"/login d'abord");await snd(c,"⏳ Chargement...");try{let p=1,tp=1,n=0;while(p<=tp){const d=await fc.fav(p);if(!d?.result)break;tp=d.result.totalPage||1;for(const u of(d.result.list||[])){const a=String(u.account||u.userId||"");if(a&&!wl.has(a)){wl.set(a,{nn:u.nick_name||u.nickName||a});n++}}p++}return snd(c,`✅ <b>${n}</b> favoris\nTotal: <b>${wl.size}</b>\n\n/go`)}catch(e){return snd(c,`❌ ${e.message}`)}}
async function go(c){if(!fc.api)return snd(c,"/login d'abord");if(!wl.size)return snd(c,"Liste vide! /watch ou /favorites");if(mon)return snd(c,"Deja en cours!");mon=true;spoll();return snd(c,`▶️ <b>ON</b>\n\n${wl.size} broadcasters\n${pi}s | ${op?"🔒 prives":"🔓 tous"}`)}
async function stp(c){if(!mon)return snd(c,"Pas en cours.");mon=false;if(pt){clearInterval(pt);pt=null}for(const[u,s]of st)if(s.rec)xdl(u);st.clear();return snd(c,"⏹ <b>OFF</b>")}
async function sts(c){let t=`<b>📊</b>\n${mon?"🟢 ON":"🔴 OFF"} | ${op?"🔒":"🔓"} | ${pi}s | ${wl.size} users | API:${fc.api?"✅":"❌"}\n\n`;let r=0;for(const[,s]of st)if(s.rec){r++;t+=`🔴 <b>${s.nn}</b> ${Math.floor((Date.now()-s.start)/60000)}min\n`}if(!r)t+="Aucun enregistrement.";return snd(c,t)}
function spoll(){ps();pt=setInterval(()=>{if(mon)ps()},pi*1000)}
async function ps(){for(const[u]of wl)try{await ck(u)}catch(e){console.error(`[P] ${u}:`,e.message)}}
async function ck(uid){const info=await fc.ui(uid);if(!info?.result)return;const nn=fc.nn(info),live=fc.isL(info),priv=fc.isP(info),s=st.get(uid);if(wl.has(uid))wl.get(uid).nn=nn;if(live&&(!s||!s.live)){console.log(`[LIVE] ${nn} (${uid})${priv?" PRIVE":""}`);if(op&&!priv){st.set(uid,{live:true,rec:false,nn,priv});return}const l=await fc.li(uid);const sid=fc.sid(l);if(!sid){st.set(uid,{live:true,rec:false,nn,priv});return}try{await axios.head(fc.flu(sid),{timeout:5000})}catch{st.set(uid,{live:true,rec:false,nn,priv});return}const d=sdl(uid,nn,sid);if(d){st.set(uid,{live:true,rec:true,nn,priv,...d,start:Date.now()});await snd(adm,`${priv?"🔒 PRIVE":"🔴 LIVE"}\n\n<b>${nn}</b> (${uid})\n🎬 Enregistrement...`)}}if(!live&&s?.live){console.log(`[OFF] ${nn}`);if(s.rec){xdl(uid);await sl(2000);if(s.filepath&&fs.existsSync(s.filepath)){const sz=fs.statSync(s.filepath).size,mb=(sz/1048576).toFixed(1);if(sz>100000){const d=Math.floor((Date.now()-s.start)/1000),m=Math.floor(d/60),sec=d%60;await snd(adm,`⏹ <b>${s.nn}</b>\n${m}m${sec}s | ${mb}MB\n⏳ Envoi...`);try{await sf(adm,s.filepath,`${s.priv?"🔒":"📹"} ${s.nn} (${uid}) ${m}m${sec}s`);await snd(adm,"✅ Envoye!")}catch(e){await snd(adm,`❌ ${e.message}`)}}else fs.unlinkSync(s.filepath)}}st.delete(uid)}}
function sl(ms){return new Promise(r=>setTimeout(r,ms))}
if(!BOT_TOKEN){console.log("\n❌ BOT_TOKEN manquant!\n\n1. @BotFather -> /newbot\n2. BOT_TOKEN=xxx node bot.js\n");process.exit(1)}
console.log("🤖 BuzzCast Recorder Bot");console.log(`📁 ${DIR}`);console.log(adm?`👤 ${adm}`:"👤 Auto-detect");console.log("Pret!\n");
poll();
BOTJS

# Install deps
npm install

echo ""
echo "✅ Installation terminee!"
echo ""
echo "========================================="
echo "  DERNIERE ETAPE:"
echo ""
echo "  1. Va sur Telegram -> @BotFather"
echo "  2. /newbot -> donne un nom -> copie le token"
echo "  3. Lance:"
echo ""
echo "  BOT_TOKEN=ton_token_ici node /root/buzzcast-bot/bot.js"
echo ""
echo "  Pour lancer en arriere-plan (survit au reboot):"
echo ""
echo '  npm i -g pm2'
echo '  BOT_TOKEN=ton_token pm2 start /root/buzzcast-bot/bot.js --name buzz'
echo '  pm2 save && pm2 startup'
echo ""
echo "========================================="
