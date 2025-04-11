const express = require('express');
const router = express.Router();
const axios = require('axios');
const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');

// 환경 변수
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || 'your-slack-client-id';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || 'your-slack-client-secret';
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/auth/callback';
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || 'your-slack-signing-secret';

// 인증 토큰 저장 (실제 환경에서는 데이터베이스에 저장해야 함)
let slackTokens = {
  access_token: null,
  user_id: null,
  team_id: null,
  team_name: null,
  expiresAt: null
};

// 슬랙 인증 상태 확인
router.get('/auth-status', async (req, res) => {
  try {
    if (!slackTokens.access_token) {
      return res.json({ 
        isAuthenticated: false, 
        message: '슬랙 인증이 필요합니다' 
      });
    }
    
    // 토큰 만료 확인
    if (slackTokens.expiresAt && new Date() > new Date(slackTokens.expiresAt)) {
      return res.json({ 
        isAuthenticated: false,
        message: '슬랙 토큰이 만료되었습니다'
      });
    }
    
    // 슬랙 클라이언트 초기화
    const slackClient = new WebClient(slackTokens.access_token);
    
    // 간단한 API 호출로 인증 확인
    const authTest = await slackClient.auth.test();
    
    if (authTest.ok) {
      return res.json({
        isAuthenticated: true,
        message: '슬랙 API 인증 완료',
        user: authTest.user,
        team: authTest.team
      });
    } else {
      slackTokens = { 
        access_token: null, 
        user_id: null, 
        team_id: null,
        team_name: null,
        expiresAt: null
      };
      
      return res.json({ 
        isAuthenticated: false, 
        message: '슬랙 인증에 실패했습니다' 
      });
    }
  } catch (error) {
    console.error('슬랙 인증 상태 확인 오류:', error);
    
    // 인증 오류면 토큰 초기화
    if (error.data && !error.data.ok) {
      slackTokens = { 
        access_token: null, 
        user_id: null, 
        team_id: null,
        team_name: null,
        expiresAt: null
      };
    }
    
    res.json({ 
      isAuthenticated: false, 
      error: error.message || '알 수 없는 오류'
    });
  }
});

// OAuth 인증 URL 생성
router.get('/auth', (req, res) => {
  const state = 'mcp-slack'; // CSRF 방지용 상태 값
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=channels:read,channels:history,chat:write,team:read,users:read&user_scope=channels:history,channels:read&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${state}`;
  
  res.redirect(authUrl);
});

// OAuth 콜백 처리
router.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error,
      message: '슬랙 인증 프로세스에서 오류가 발생했습니다'
    });
  }
  
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: 'missing_code',
      message: '인증 코드가 없습니다'
    });
  }
  
  // 상태 값 검증
  if (state !== 'mcp-slack') {
    return res.status(400).json({ 
      success: false, 
      error: 'invalid_state',
      message: '유효하지 않은 상태 값입니다'
    });
  }
  
  try {
    // 토큰 교환 요청
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri: SLACK_REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    if (!data.ok) {
      console.error('슬랙 OAuth 오류:', data.error);
      return res.status(400).json({
        success: false,
        error: data.error,
        message: '토큰 교환 과정에서 오류가 발생했습니다'
      });
    }
    
    // 토큰 저장
    slackTokens = {
      access_token: data.access_token,
      user_id: data.authed_user ? data.authed_user.id : null,
      team_id: data.team ? data.team.id : null,
      team_name: data.team ? data.team.name : null,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12시간 후 만료
    };
    
    console.log('슬랙 인증 성공:', {
      team: data.team ? data.team.name : 'Unknown',
      user: data.authed_user ? data.authed_user.id : 'Unknown'
    });
    
    // 성공 응답
    res.json({
      success: true,
      message: '슬랙 인증이 완료되었습니다',
      team: data.team ? data.team.name : null,
      expiresAt: slackTokens.expiresAt
    });
  } catch (error) {
    console.error('슬랙 인증 콜백 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: '인증 처리 중 서버 오류가 발생했습니다'
    });
  }
});

// 채널 목록 가져오기
router.get('/channels', async (req, res) => {
  try {
    if (!slackTokens.access_token) {
      return res.status(401).json({ 
        error: '인증이 필요합니다',
        authenticated: false
      });
    }
    
    const slackClient = new WebClient(slackTokens.access_token);
    
    // 채널 목록 요청
    const result = await slackClient.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true
    });
    
    if (!result.ok) {
      throw new Error(result.error || '채널 목록을 가져오지 못했습니다');
    }
    
    res.json(result.channels || []);
  } catch (error) {
    console.error('슬랙 채널 목록 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 팀 정보 가져오기
router.get('/team', async (req, res) => {
  try {
    if (!slackTokens.access_token) {
      return res.status(401).json({ 
        error: '인증이 필요합니다',
        authenticated: false
      });
    }
    
    const slackClient = new WebClient(slackTokens.access_token);
    
    // 팀 정보 요청
    const result = await slackClient.team.info();
    
    if (!result.ok) {
      throw new Error(result.error || '팀 정보를 가져오지 못했습니다');
    }
    
    res.json(result.team || null);
  } catch (error) {
    console.error('슬랙 팀 정보 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 채널 메시지 가져오기
router.get('/channels/:channelId/messages', async (req, res) => {
  try {
    if (!slackTokens.access_token) {
      return res.status(401).json({ 
        error: '인증이 필요합니다',
        authenticated: false
      });
    }
    
    const { channelId } = req.params;
    const { limit = 50 } = req.query;
    
    const slackClient = new WebClient(slackTokens.access_token);
    
    // 채널 메시지 요청
    const result = await slackClient.conversations.history({
      channel: channelId,
      limit: parseInt(limit)
    });
    
    if (!result.ok) {
      throw new Error(result.error || '채널 메시지를 가져오지 못했습니다');
    }
    
    const messages = result.messages || [];
    
    // 사용자 정보 캐시
    const userCache = {};
    
    // 고유 사용자 ID 추출
    const userIds = [...new Set(
      messages
        .filter(msg => msg.user)
        .map(msg => msg.user)
    )];
    
    // 사용자 정보 가져오기
    if (userIds.length > 0) {
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const userInfo = await slackClient.users.info({ user: userId });
            if (userInfo.ok && userInfo.user) {
              userCache[userId] = {
                real_name: userInfo.user.real_name || userInfo.user.name,
                display_name: userInfo.user.profile.display_name,
                image: userInfo.user.profile.image_72
              };
            }
          } catch (error) {
            console.error(`사용자 ${userId} 정보 가져오기 오류:`, error);
          }
        })
      );
    }
    
    // 메시지에 사용자 정보 추가
    const enhancedMessages = messages.map(msg => ({
      ...msg,
      userInfo: msg.user ? userCache[msg.user] : null
    }));
    
    res.json({
      messages: enhancedMessages,
      has_more: result.has_more,
      channel_id: channelId
    });
  } catch (error) {
    console.error('슬랙 채널 메시지 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 메시지 전송
router.post('/channels/:channelId/messages', async (req, res) => {
  try {
    if (!slackTokens.access_token) {
      return res.status(401).json({ 
        error: '인증이 필요합니다',
        authenticated: false
      });
    }
    
    const { channelId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: '메시지 내용이 필요합니다' });
    }
    
    const slackClient = new WebClient(slackTokens.access_token);
    
    // 메시지 전송
    const result = await slackClient.chat.postMessage({
      channel: channelId,
      text: text
    });
    
    if (!result.ok) {
      throw new Error(result.error || '메시지를 전송하지 못했습니다');
    }
    
    res.json({
      success: true,
      message: '메시지가 전송되었습니다',
      ts: result.ts,
      channel: result.channel
    });
  } catch (error) {
    console.error('슬랙 메시지 전송 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 