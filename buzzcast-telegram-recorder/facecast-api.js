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
