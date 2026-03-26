const axios = require('axios');

const BASE_URL = 'https://dhcxzil.facecast.xyz/faceshow';
const LIVE_URL = 'https://live.facecast.xyz/live';

function randomSlashes() {
  return '/'.repeat(Math.floor(10 * Math.random()));
}

class FacecastAPI {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
  }

  // Login avec email + mot de passe -> retourne { userId, token }
  static async login(email, password) {
    const url = `${BASE_URL}/api/sys/login/v2`;
    const res = await axios.post(url, null, {
      params: {
        deviceId: '214035648725148',
        email,
        pwd: password,
        type: 2
      }
    });
    const data = res.data;
    if (data.code === '40007' || data.msg !== 'Login successfully') {
      throw new Error(data.msg || 'Login failed');
    }
    return {
      userId: String(data.result.userId),
      token: data.result.token,
      nickName: data.result.nickName || ''
    };
  }

  async getUserInfo(targetUserId) {
    const url = `${BASE_URL}/tokens/PersonalHome/${randomSlashes()}findHomeUserInfo?userId=${targetUserId}`;
    const res = await axios.post(url, null, {
      params: { systoken: this.token, userId: targetUserId }
    });
    return res.data;
  }

  async getLiveInfo(targetUserId) {
    const url = `${BASE_URL}/tokens/ranking/v2/getLastLiveInfoByUserId?liveUserId=${targetUserId}`;
    const res = await axios.get(url);
    return res.data;
  }

  async getStreamInfo(userId, liveId) {
    const param = JSON.stringify({ likeNum: '', liveId, userId });
    const url = `${BASE_URL}/tokens/live/newLive/${randomSlashes()}getLiveInfo?param=${encodeURI(param)}`;
    const res = await axios.post(url, null, {
      params: { systoken: this.token }
    });
    return res.data;
  }

  async getFavorites(page = 1) {
    const url = `${BASE_URL}/user/attention/${randomSlashes()}listAttention`;
    const res = await axios.post(url, null, {
      params: {
        systoken: this.token,
        userId: this.userId,
        currPage: page,
        pageSize: 20,
        types: 0
      }
    });
    return res.data;
  }

  isPrivateStream(userInfo) {
    if (!userInfo || !userInfo.result) return false;
    const { liveData, isLive } = userInfo.result;
    return liveData && liveData.flv_url !== '' && isLive === 0;
  }

  isLive(userInfo) {
    if (!userInfo || !userInfo.result) return false;
    return userInfo.result.isLive === 1;
  }

  getStreamUrls(streamId) {
    return {
      flv: `${LIVE_URL}/${streamId}.flv`,
      hls: `${LIVE_URL}/${streamId}.m3u8`,
      rtmp: `rtmp://live.facecast.xyz/live/${streamId}`
    };
  }
}

module.exports = FacecastAPI;
