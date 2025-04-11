const express = require('express');
const router = express.Router();
const { Client } = require('@microsoft/microsoft-graph-client');
const axios = require('axios');
const { ConfidentialClientApplication } = require('@azure/msal-node');

// MSAL 설정
const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/consumers',
    clientSecret: process.env.MS_CLIENT_SECRET
  }
};

// 필요한 Graph API 권한 스코프
const scopes = ['User.Read', 'Chat.Read', 'Chat.ReadWrite', 'TeamMember.Read.All', 'Team.ReadBasic.All', 'ChannelMessage.Read.All'];

// MSAL 클라이언트 생성
const msalClient = new ConfidentialClientApplication(msalConfig);

// MS Graph API 클라이언트 설정
const getGraphClient = (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

// MS Graph API에 사용할 액세스 토큰 가져오기
const getAccessToken = async () => {
  try {
    // 이미 토큰이 있으면 사용
    if (process.env.MS_GRAPH_TOKEN) {
      return process.env.MS_GRAPH_TOKEN;
    }

    // 토큰이 없고 콜백으로 인증되지 않은 경우
    // 인증되지 않은 상태 반환 (UI에서 인증 버튼 표시를 위함)
    throw new Error('사용자가 인증되지 않았습니다. 로그인이 필요합니다.');
  } catch (error) {
    console.error('액세스 토큰 가져오기 오류:', error);
    throw error;
  }
};

// 인증 URL 생성
router.get('/auth-url', (req, res) => {
  try {
    // 리디렉션 URL
    const redirectUri = 'http://localhost:3000/teams';
    
    // 상태 파라미터 생성 (CSRF 방지)
    const state = Buffer.from(JSON.stringify({ redirectPath: '/teams' })).toString('base64');
    
    // 인증 URL 생성
    const authCodeUrlParameters = {
      scopes: scopes,
      redirectUri: redirectUri,
      state: state
    };

    msalClient.getAuthCodeUrl(authCodeUrlParameters)
      .then((url) => {
        console.log('인증 URL 생성 완료:', url);
        res.json({ url });
      })
      .catch((error) => {
        console.error('인증 URL 생성 오류:', error);
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    console.error('인증 URL 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 인증 콜백 처리는 프론트엔드에서 처리합니다.
// 클라이언트 앱이 직접 코드를 받아서 토큰으로 교환하는 방식으로 변경

// 클라이언트에서 인증 코드를 받아 토큰 발급
router.post('/auth-token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '인증 코드가 제공되지 않았습니다.' });
    }
    
    // 토큰 교환 요청
    const tokenResponse = await msalClient.acquireTokenByCode({
      code: code,
      scopes: scopes,
      redirectUri: 'http://localhost:3000/teams'
    });
    
    // 액세스 토큰 저장
    process.env.MS_GRAPH_TOKEN = tokenResponse.accessToken;
    
    res.json({
      success: true,
      expiresIn: tokenResponse.expiresOn,
      user: tokenResponse.account
    });
  } catch (error) {
    console.error('토큰 획득 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 인증 상태 확인
router.get('/auth-status', async (req, res) => {
  try {
    // 토큰 가져오기
    const accessToken = await getAccessToken().catch(err => {
      throw new Error('인증 토큰이 없습니다.');
    });
    
    // 토큰이 있으면 사용자 정보 가져오기
    const client = getGraphClient(accessToken);
    const me = await client.api('/me').get();
    
    res.json({
      isAuthenticated: true,
      user: {
        id: me.id,
        displayName: me.displayName,
        email: me.mail || me.userPrincipalName
      }
    });
  } catch (error) {
    console.error('Teams 인증 상태 확인 오류:', error);
    res.json({ 
      isAuthenticated: false, 
      error: error.message 
    });
  }
});

// 채팅 목록 가져오기
router.get('/chats', async (req, res) => {
  try {
    // 테스트용 더미 데이터
    const now = new Date();
    const dummyChats = [
      {
        id: '1',
        title: '프로젝트 팀',
        type: 'group',
        lastUpdated: now.toISOString(),
        lastMessage: {
          from: '김철수',
          content: '회의 시간을 확인해 주세요'
        },
        unreadCount: 3,
        participants: [
          { id: 'user1', displayName: '김철수', email: 'user1@example.com' },
          { id: 'user2', displayName: '이영희', email: 'user2@example.com' }
        ]
      },
      {
        id: '2',
        title: '김철수',
        type: 'personal',
        lastUpdated: now.toISOString(),
        lastMessage: {
          from: '김철수',
          content: '안녕하세요'
        },
        unreadCount: 0,
        participants: [
          { id: 'user1', displayName: '김철수', email: 'user1@example.com' }
        ]
      }
    ];
    
    res.json(dummyChats);
  } catch (error) {
    console.error('Teams 채팅 목록 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 특정 채팅의 메시지 가져오기
router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // 테스트용 더미 데이터
    const now = new Date();
    const dummyMessages = [
      {
        id: 'm1',
        content: '안녕하세요',
        contentType: 'text',
        createdDateTime: new Date(now.getTime() - 600000).toISOString(), // 10분 전
        isFromMe: false,
        from: '김철수'
      },
      {
        id: 'm2',
        content: '네, 안녕하세요',
        contentType: 'text',
        createdDateTime: new Date(now.getTime() - 300000).toISOString(), // 5분 전
        isFromMe: true,
        from: '나'
      },
      {
        id: 'm3',
        content: '회의 일정 변경됐어요',
        contentType: 'text',
        createdDateTime: new Date(now.getTime() - 60000).toISOString(), // 1분 전
        isFromMe: false,
        from: '김철수'
      }
    ];
    
    res.json(dummyMessages);
  } catch (error) {
    console.error(`Teams 메시지 가져오기 오류(채팅 ID: ${req.params.chatId}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 메시지 보내기
router.post('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, contentType = 'text' } = req.body;
    
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // 메시지 보내기
    const response = await client.api(`/me/chats/${chatId}/messages`).post({
      body: {
        content,
        contentType
      }
    });
    
    res.status(201).json({
      success: true,
      message: {
        id: response.id,
        content: response.body.content,
        timestamp: response.createdDateTime
      }
    });
  } catch (error) {
    console.error(`Teams 메시지 보내기 오류(채팅 ID: ${req.params.chatId}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 채팅 읽음 상태 표시
router.post('/chats/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // 실제 API에서는 메시지 읽음 상태를 업데이트하는 호출 필요
    // 현재는 성공 응답만 반환
    res.json({ success: true });
  } catch (error) {
    console.error(`Teams 채팅 읽음 상태 업데이트 오류(채팅 ID: ${req.params.chatId}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 회의 목록 가져오기
router.get('/meetings', async (req, res) => {
  try {
    // 테스트용 더미 데이터
    const now = new Date();
    const dummyMeetings = [
      {
        id: 'meeting1',
        subject: '주간 팀 회의',
        startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
        endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0).toISOString(),
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-url-1',
        organizer: {
          email: 'manager@example.com',
          name: '관리자'
        },
        attendees: [
          {
            email: 'user1@example.com',
            name: '김철수'
          },
          {
            email: 'user2@example.com',
            name: '이영희'
          }
        ]
      },
      {
        id: 'meeting2',
        subject: '프로젝트 계획 회의',
        startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0).toISOString(),
        endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 30).toISOString(),
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-url-2',
        organizer: {
          email: 'me@example.com',
          name: '내 이름'
        },
        attendees: [
          {
            email: 'user1@example.com',
            name: '김철수'
          },
          {
            email: 'user3@example.com',
            name: '박지성'
          }
        ]
      }
    ];
    
    res.json(dummyMeetings);
  } catch (error) {
    console.error('Teams 회의 목록 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 새 회의 생성
router.post('/meetings', async (req, res) => {
  try {
    const { subject, startDateTime, endDateTime, attendees = [] } = req.body;
    
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // 회의 생성
    const response = await client.api('/me/onlineMeetings').post({
      startDateTime,
      endDateTime,
      subject,
      participants: {
        attendees: attendees.map(a => ({
          upn: a.email,
          role: 'attendee'
        }))
      }
    });
    
    res.status(201).json({
      id: response.id,
      subject: response.subject,
      startDateTime: response.startDateTime,
      endDateTime: response.endDateTime,
      joinUrl: response.joinUrl
    });
  } catch (error) {
    console.error('Teams 회의 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 회의 상세 정보 가져오기
router.get('/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // 회의 정보 가져오기
    const meeting = await client.api(`/me/onlineMeetings/${meetingId}`)
      .select('id,subject,startDateTime,endDateTime,joinUrl,participants')
      .get();
    
    res.json({
      id: meeting.id,
      subject: meeting.subject || '제목 없음',
      startDateTime: meeting.startDateTime,
      endDateTime: meeting.endDateTime,
      joinUrl: meeting.joinUrl,
      organizer: {
        email: meeting.participants?.organizer?.upn,
        name: meeting.participants?.organizer?.upn.split('@')[0]
      },
      attendees: meeting.participants?.attendees?.map(a => ({
        email: a.upn,
        name: a.upn.split('@')[0]
      })) || []
    });
  } catch (error) {
    console.error(`Teams 회의 정보 가져오기 오류(회의 ID: ${req.params.meetingId}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 팀즈 데이터 가져오기
const fetchData = async () => {
  setLoading(true);
  try {
    // 실제 API 호출 대신 테스트용 더미 데이터 사용
    const dummyChats = [
      {
        id: '1',
        title: '프로젝트 팀',
        type: 'group',
        lastUpdated: new Date().toISOString(),
        lastMessage: {
          from: '김철수',
          content: '회의 시간을 확인해 주세요'
        },
        unreadCount: 3,
        participants: [
          { id: 'user1', displayName: '김철수', email: 'user1@example.com' },
          { id: 'user2', displayName: '이영희', email: 'user2@example.com' }
        ]
      },
      {
        id: '2',
        title: '김철수',
        type: 'personal',
        lastUpdated: new Date().toISOString(),
        lastMessage: {
          from: '김철수',
          content: '안녕하세요'
        },
        unreadCount: 0,
        participants: [
          { id: 'user1', displayName: '김철수', email: 'user1@example.com' }
        ]
      }
    ];
    
    const now = new Date();
    const dummyMeetings = [
      {
        id: 'meeting1',
        subject: '주간 팀 회의',
        startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0).toISOString(),
        endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0).toISOString(),
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-url-1',
        organizer: {
          email: 'manager@example.com',
          name: '관리자'
        },
        attendees: [
          {
            email: 'user1@example.com',
            name: '김철수'
          },
          {
            email: 'user2@example.com',
            name: '이영희'
          }
        ]
      },
      {
        id: 'meeting2',
        subject: '프로젝트 계획 회의',
        startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0).toISOString(),
        endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 30).toISOString(),
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/dummy-url-2',
        organizer: {
          email: 'me@example.com',
          name: '내 이름'
        },
        attendees: [
          {
            email: 'user1@example.com',
            name: '김철수'
          },
          {
            email: 'user3@example.com',
            name: '박지성'
          }
        ]
      }
    ];
    
    setChats(dummyChats);
    setMeetings(dummyMeetings);
    setConnected(true);
    setLoading(false);
    setStatusMessage('');
  } catch (err) {
    setError('팀즈 데이터를 불러오는 중 오류가 발생했습니다.');
    setLoading(false);
    setStatusMessage('');
    console.error('팀즈 데이터 로드 오류:', err);
  }
};

module.exports = router; 