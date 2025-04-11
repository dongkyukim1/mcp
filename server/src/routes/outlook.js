const express = require('express');
const router = express.Router();
const { Client } = require('@microsoft/microsoft-graph-client');
const axios = require('axios');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const fs = require('fs');
const path = require('path');

// 토큰 저장 파일 경로
const TOKEN_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'outlook_token.json');

// 토큰 저장 디렉토리 확인 및 생성
const ensureTokenDirectory = () => {
  const dir = path.dirname(TOKEN_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 토큰 저장 함수
const saveToken = (token) => {
  try {
    ensureTokenDirectory();
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify({ token, timestamp: Date.now() }));
    console.log('토큰이 파일에 저장되었습니다.');
    return true;
  } catch (error) {
    console.error('토큰 저장 오류:', error);
    return false;
  }
};

// 토큰 가져오기 함수
const loadToken = () => {
  try {
    if (!fs.existsSync(TOKEN_FILE_PATH)) {
      return null;
    }
    
    const data = fs.readFileSync(TOKEN_FILE_PATH, 'utf8');
    const tokenData = JSON.parse(data);
    
    // 토큰이 24시간 이상 지났는지 확인 (24시간 = 86400000 밀리초)
    if (Date.now() - tokenData.timestamp > 86400000) {
      console.log('저장된 토큰이 만료되었습니다.');
      return null;
    }
    
    return tokenData.token;
  } catch (error) {
    console.error('토큰 로드 오류:', error);
    return null;
  }
};

// 토큰 삭제 함수
const deleteToken = () => {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      fs.unlinkSync(TOKEN_FILE_PATH);
      console.log('토큰 파일이 삭제되었습니다.');
    }
    return true;
  } catch (error) {
    console.error('토큰 삭제 오류:', error);
    return false;
  }
};

// MSAL 설정
const msalConfig = {
  auth: {
    clientId: process.env.MS_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/netcomsolution.co.kr',
    clientSecret: process.env.MS_CLIENT_SECRET
  }
};

// 필요한 Graph API 권한 스코프
const scopes = ['User.Read', 'Mail.Read', 'Mail.Send', 'Calendars.Read', 'Calendars.ReadWrite'];

// MSAL 클라이언트 생성
const msalClient = new ConfidentialClientApplication(msalConfig);

// MS Graph API 클라이언트 설정 (Teams와 동일)
const getGraphClient = (accessToken) => {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
};

// MS Graph API에 사용할 액세스 토큰 가져오기 (Teams와 동일)
const getAccessToken = async () => {
  try {
    console.log('액세스 토큰 요청...');
    const token = loadToken();
    
    if (token) {
      console.log('파일에서 토큰을 찾았습니다.');
      
      // JWT 토큰 형식 검증 (점으로 구분된 세 부분으로 이루어져야 함)
      if (!token.includes('.') || token.split('.').length !== 3) {
        console.error('토큰 형식이 잘못되었습니다. 토큰을 삭제하고 재인증을 진행합니다.');
        deleteToken();
        throw new Error('토큰 형식이 잘못되었습니다. 재인증이 필요합니다.');
      }
      
      return token;
    }

    console.log('토큰이 없습니다. 인증이 필요합니다.');
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
    const redirectUri = 'http://localhost:3000/outlook';
    
    // 상태 파라미터 생성 (CSRF 방지)
    const state = Buffer.from(JSON.stringify({ redirectPath: '/outlook' })).toString('base64');
    
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

// 클라이언트에서 인증 코드를 받아 토큰 발급
router.post('/auth-token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: '인증 코드가 제공되지 않았습니다.' });
    }
    
    console.log('인증 코드를 토큰으로 교환 중...');
    console.log('코드 길이:', code.length);
    
    // 토큰 교환 요청
    const tokenResponse = await msalClient.acquireTokenByCode({
      code: code,
      scopes: scopes,
      redirectUri: 'http://localhost:3000/outlook'
    });
    
    console.log('토큰 획득 성공, 응답 구조:', Object.keys(tokenResponse));
    
    // accessToken 정보 확인
    if (!tokenResponse.accessToken) {
      console.error('액세스 토큰이 없습니다!');
      return res.status(400).json({ 
        error: '액세스 토큰이 없습니다',
        tokenResponse: JSON.stringify(tokenResponse, null, 2)
      });
    }
    
    console.log('토큰 길이:', tokenResponse.accessToken.length);
    console.log('토큰 샘플:', tokenResponse.accessToken.substring(0, 20) + '...');
    
    // JWT 토큰 형식 확인
    if (!tokenResponse.accessToken.includes('.')) {
      console.error('토큰에 점(.)이 없습니다. JWT 형식이 아닙니다.');
      return res.status(400).json({ 
        error: 'JWT 형식이 아닌 토큰',
        tokenSample: tokenResponse.accessToken.substring(0, 30) + '...'
      });
    }
    
    const parts = tokenResponse.accessToken.split('.');
    if (parts.length !== 3) {
      console.error(`토큰 부분 개수가 ${parts.length}개로, 3개가 아닙니다.`);
      return res.status(400).json({ 
        error: 'JWT 형식이 아닌 토큰 (부분 개수 불일치)',
        parts: parts.length
      });
    }
    
    console.log('토큰 형식 확인 완료 - 유효한 JWT 형식');
    
    // 액세스 토큰 저장
    process.env.MS_GRAPH_TOKEN = tokenResponse.accessToken;
    console.log('토큰이 환경 변수에 저장되었습니다.');
    
    // 토큰으로 간단한 Graph API 호출 테스트
    try {
      const client = getGraphClient(tokenResponse.accessToken);
      const me = await client.api('/me').get();
      console.log('토큰으로 사용자 정보 호출 성공:', me.displayName);
    } catch (testError) {
      console.error('토큰 테스트 오류:', testError);
      // 오류는 보고하지만 진행은 계속
    }
    
    res.json({
      success: true,
      expiresIn: tokenResponse.expiresOn,
      user: tokenResponse.account
    });
  } catch (error) {
    console.error('토큰 획득 오류:', error);
    // 오류 객체 분석
    let errorDetails = "세부 정보 없음";
    try {
      errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (e) {
      console.error('오류 객체 직렬화 실패:', e);
    }
    console.error('오류 세부 정보:', errorDetails);
    
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      errorObj: errorDetails
    });
  }
});

// 인증 상태 확인
router.get('/auth-status', async (req, res) => {
  try {
    console.log('인증 상태 확인 요청...');
    // 토큰 가져오기
    const accessToken = await getAccessToken().catch(err => {
      console.log('토큰 가져오기 실패:', err.message);
      throw new Error('인증 토큰이 없습니다.');
    });
    
    console.log('토큰 확인 성공, 사용자 정보 요청 중...');
    // 토큰이 있으면 사용자 정보 가져오기
    const client = getGraphClient(accessToken);
    const me = await client.api('/me').get();
    
    console.log('사용자 정보 획득 성공:', me.displayName);
    
    res.json({
      isAuthenticated: true,
      user: {
        id: me.id,
        displayName: me.displayName,
        email: me.mail || me.userPrincipalName
      }
    });
  } catch (error) {
    console.error('Outlook 인증 상태 확인 오류:', error);
    res.json({ 
      isAuthenticated: false, 
      error: error.message 
    });
  }
});

// 이메일 목록 가져오기
router.get('/emails', async (req, res) => {
  try {
    console.log('이메일 목록 가져오기 요청을 받았습니다.');
    const accessToken = await getAccessToken();
    console.log('액세스 토큰 획득 성공');
    const client = getGraphClient(accessToken);
    
    // Microsoft Graph API를 사용하여 실제 이메일 가져오기
    console.log('Microsoft Graph API 호출 시작...');
    
    try {
      // 받은 편지함(inbox) 명시적으로 지정
      const response = await client
        .api('/me/mailFolders/inbox/messages')
        .select('id,subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients,isRead,importance,hasAttachments')
        .top(50)
        .orderby('receivedDateTime DESC')
        .get();
      
      console.log(`받은 편지함에서 이메일 ${response.value.length}개를 가져왔습니다.`);
      
      const emails = response.value.map(email => ({
        id: email.id,
        subject: email.subject || '(제목 없음)',
        bodyPreview: email.bodyPreview,
        receivedDateTime: email.receivedDateTime,
        isRead: email.isRead,
        importance: email.importance,
        hasAttachments: email.hasAttachments,
        from: {
          name: email.from.emailAddress.name || email.from.emailAddress.address.split('@')[0],
          address: email.from.emailAddress.address
        },
        to: email.toRecipients.map(r => ({
          name: r.emailAddress.name || r.emailAddress.address.split('@')[0],
          address: r.emailAddress.address
        })),
        cc: email.ccRecipients?.map(r => ({
          name: r.emailAddress.name || r.emailAddress.address.split('@')[0],
          address: r.emailAddress.address
        })) || []
      }));
      
      res.json(emails);
    } catch (apiError) {
      console.error('Microsoft Graph API 호출 오류:', apiError);
      console.error('API 오류 세부 정보:', JSON.stringify(apiError, null, 2));
      
      // 다시 전체 메일함을 시도
      console.log('전체 메일함 시도 중...');
      const allMailsResponse = await client
        .api('/me/messages')
        .select('id,subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients,isRead,importance,hasAttachments')
        .top(50)
        .orderby('receivedDateTime DESC')
        .get();
      
      console.log(`전체 메일함에서 이메일 ${allMailsResponse.value.length}개를 가져왔습니다.`);
      
      const emails = allMailsResponse.value.map(email => ({
        id: email.id,
        subject: email.subject || '(제목 없음)',
        bodyPreview: email.bodyPreview,
        receivedDateTime: email.receivedDateTime,
        isRead: email.isRead,
        importance: email.importance,
        hasAttachments: email.hasAttachments,
        from: {
          name: email.from.emailAddress.name || email.from.emailAddress.address.split('@')[0],
          address: email.from.emailAddress.address
        },
        to: email.toRecipients.map(r => ({
          name: r.emailAddress.name || r.emailAddress.address.split('@')[0],
          address: r.emailAddress.address
        })),
        cc: email.ccRecipients?.map(r => ({
          name: r.emailAddress.name || r.emailAddress.address.split('@')[0],
          address: r.emailAddress.address
        })) || []
      }));
      
      res.json(emails);
    }
  } catch (error) {
    console.error('Outlook 이메일 목록 가져오기 오류:', error);
    console.error('오류 세부 정보:', JSON.stringify(error, null, 2));
    res.status(500).json({ error: error.message });
  }
});

// 특정 이메일 가져오기
router.get('/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // 특정 이메일 가져오기
    const email = await client
      .api(`/me/messages/${id}`)
      .select('id,subject,body,receivedDateTime,from,toRecipients,ccRecipients,hasAttachments,isRead')
      .get();
    
    // 첨부 파일이 있는 경우 첨부 파일 정보 가져오기
    let attachments = [];
    if (email.hasAttachments) {
      const attachmentsResponse = await client.api(`/me/messages/${id}/attachments`).get();
      attachments = attachmentsResponse.value.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        contentType: attachment.contentType,
        size: attachment.size,
        url: `https://graph.microsoft.com/v1.0/me/messages/${id}/attachments/${attachment.id}/$value`
      }));
    }
    
    res.json({
      id: email.id,
      subject: email.subject || '(제목 없음)',
      body: email.body.content,
      contentType: email.body.contentType,
      receivedAt: email.receivedDateTime,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
      sender: {
        email: email.from.emailAddress.address,
        name: email.from.emailAddress.name || email.from.emailAddress.address.split('@')[0]
      },
      to: email.toRecipients.map(r => ({
        email: r.emailAddress.address,
        name: r.emailAddress.name
      })),
      cc: email.ccRecipients?.map(r => ({
        email: r.emailAddress.address,
        name: r.emailAddress.name
      })),
      attachments
    });
  } catch (error) {
    console.error(`Outlook 이메일 가져오기 오류(이메일 ID: ${req.params.id}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 이메일 읽음 상태 변경
router.put('/emails/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // 이메일 읽음 상태 업데이트
    await client.api(`/me/messages/${id}`).update({
      isRead: true
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Outlook 이메일 읽음 상태 업데이트 오류(이메일 ID: ${req.params.id}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 이메일 별표 상태 변경
router.put('/emails/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    const { isStarred } = req.body;
    
    // Microsoft Graph API에서는 직접 별표 API가 없어 다른 방식으로 구현
    // 여기서는 성공 응답만 반환 (실제로는 다른 방식으로 구현해야 함)
    res.json({ success: true, isStarred });
  } catch (error) {
    console.error(`Outlook 이메일 별표 상태 업데이트 오류(이메일 ID: ${req.params.id}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 이메일 삭제
router.delete('/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // 이메일 삭제
    await client.api(`/me/messages/${id}`).delete();
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Outlook 이메일 삭제 오류(이메일 ID: ${req.params.id}):`, error);
    res.status(500).json({ error: error.message });
  }
});

// 일정 목록 가져오기
router.get('/events', async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const client = getGraphClient(accessToken);
    
    // Microsoft Graph API를 사용하여 실제 일정 가져오기
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 2주 후까지의 일정
    
    const response = await client
      .api('/me/calendarView')
      .select('id,subject,bodyPreview,start,end,location,showAs,organizer,attendees')
      .header('Prefer', 'outlook.timezone="Asia/Seoul"') // 타임존 설정
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString()
      })
      .orderby('start/dateTime')
      .top(50) // 최대 50개 일정 가져오기
      .get();
    
    const events = response.value.map(event => ({
      id: event.id,
      subject: event.subject || '(제목 없음)',
      bodyPreview: event.bodyPreview,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      showAs: event.showAs,
      organizer: {
        email: event.organizer.emailAddress.address,
        name: event.organizer.emailAddress.name || event.organizer.emailAddress.address.split('@')[0]
      },
      attendees: event.attendees?.map(a => ({
        email: a.emailAddress.address,
        name: a.emailAddress.name || a.emailAddress.address.split('@')[0],
        status: a.status?.response
      })) || []
    }));
    
    res.json(events);
  } catch (error) {
    console.error('Outlook 일정 목록 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  try {
    // 저장된 액세스 토큰 삭제
    deleteToken();
    console.log('Outlook 인증 토큰이 삭제되었습니다.');
    
    res.json({ success: true, message: '로그아웃 되었습니다.' });
  } catch (error) {
    console.error('Outlook 로그아웃 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 토큰이 있는지 확인하고 삭제
try {
  const tokenFilePath = path.join(__dirname, '..', '..', 'data', 'outlook_token.json');
  if (fs.existsSync(tokenFilePath)) {
    fs.unlinkSync(tokenFilePath);
    console.log('기존 토큰 파일 삭제됨');
  }
} catch (error) {
  console.error('토큰 파일 삭제 중 오류:', error);
}

module.exports = router; 