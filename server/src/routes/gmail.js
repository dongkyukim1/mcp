const express = require('express');
const router = express.Router();
const { createOAuthClient } = require('../utils/googleClient');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

// OAuth 클라이언트 생성
const oauth2Client = createOAuthClient();

// 인증 토큰 저장소 (실제 프로덕션에서는 데이터베이스에 저장해야 함)
let tokens = null;

// Gmail 인증 상태 확인
router.get('/auth-status', async (req, res) => {
  try {
    if (!tokens) {
      return res.json({
        isAuthenticated: false,
        message: 'Gmail API 인증이 필요합니다'
      });
    }
    
    // 토큰 설정
    oauth2Client.setCredentials(tokens);
    
    // Gmail 클라이언트 생성
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 프로필 정보 가져오기
    await gmail.users.getProfile({ userId: 'me' });
    
    res.json({
      isAuthenticated: true,
      message: 'Gmail API 인증 완료'
    });
  } catch (error) {
    console.error('Gmail 인증 상태 확인 오류:', error);
    res.json({
      isAuthenticated: false,
      error: error.message
    });
  }
});

// OAuth 인증 URL 생성 라우트
router.get('/auth', (req, res) => {
  console.log('===== Gmail 인증 요청 받음 =====');
  
  // 기존 토큰 제거
  tokens = null;
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    // 본문 읽기에 필요한 스코프만 요청 (메타데이터 스코프 제외)
    scope: [
      'https://mail.google.com/',                           // 메일 전체 액세스 최상위 권한
      'https://www.googleapis.com/auth/gmail.readonly',     // 이메일 읽기 권한 (내용 포함)
      'https://www.googleapis.com/auth/gmail.modify',       // 메일 수정 권한 (읽기 포함)
      'https://www.googleapis.com/auth/gmail.compose',      // 메일 작성 권한
      'https://www.googleapis.com/auth/gmail.send',         // 메일 전송 권한
      'https://www.googleapis.com/auth/gmail.insert',       // 메일 삽입 권한
      'https://www.googleapis.com/auth/gmail.labels',       // 라벨 관리 권한
      'https://www.googleapis.com/auth/gmail.settings.basic',// 기본 설정 권한
      'https://www.googleapis.com/auth/gmail.settings.sharing'// 공유 설정 권한
    ],
    include_granted_scopes: true,
    // 항상 새로운 동의 화면 표시
    prompt: 'consent'
  });
  
  console.log('생성된 Gmail 인증 URL:', authUrl);
  console.log('리디렉션 중...');
  res.redirect(authUrl);
});

// OAuth 콜백 처리 라우트
router.get('/auth/callback', async (req, res) => {
  console.log('===== Gmail OAuth 콜백 받음 =====');
  const { code } = req.query;
  console.log('인증 코드 받음:', code ? '(코드 존재)' : '코드 없음');
  
  try {
    if (!code) {
      throw new Error('인증 코드가 없습니다');
    }
    
    // 코드를 토큰으로 교환
    console.log('토큰 교환 시도 중...');
    const { tokens: authTokens } = await oauth2Client.getToken(code);
    tokens = authTokens;
    console.log('토큰 교환 성공!');
    
    // 토큰 스코프 확인 (매우 중요)
    console.log('===== 받은 토큰 스코프 확인 =====');
    console.log('스코프 문자열:', tokens.scope);
    
    // 개별 스코프 목록 확인
    const scopes = tokens.scope.split(' ');
    console.log('개별 스코프 목록:');
    scopes.forEach((scope, index) => {
      console.log(`${index + 1}. ${scope}`);
    });
    
    // 중요 스코프 확인
    const hasMailScope = scopes.includes('https://mail.google.com/');
    const hasReadonlyScope = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
    const hasMetadataScope = scopes.includes('https://www.googleapis.com/auth/gmail.metadata');
    
    console.log('필수 스코프 포함 여부:');
    console.log('- 메일 전체 액세스(mail.google.com):', hasMailScope ? '있음 ✓' : '없음 ✗');
    console.log('- 읽기 전용 권한(gmail.readonly):', hasReadonlyScope ? '있음 ✓' : '없음 ✗');
    console.log('- 메타데이터 권한(gmail.metadata):', hasMetadataScope ? '있음 ✓' : '없음 ✗');
    
    if (!hasMailScope && !hasReadonlyScope) {
      console.warn('⚠️ 경고: 이메일 본문을 가져오는 데 필요한 권한이 부족합니다!');
      console.warn('사용자가 인증 화면에서 모든 권한에 동의하지 않았을 수 있습니다.');
    }
    
    // 토큰 설정
    oauth2Client.setCredentials(tokens);
    
    // 인증 성공 페이지로 리디렉션
    console.log('클라이언트로 리디렉션 중... 리디렉션 URL: http://localhost:3000/gmail?auth=success');
    res.redirect('http://localhost:3000/gmail?auth=success');
  } catch (error) {
    console.error('Gmail OAuth 콜백 오류:', error);
    res.redirect('http://localhost:3000/gmail?auth=error&message=' + encodeURIComponent(error.message));
  }
});

// 메시지 목록 가져오기
router.get('/messages', async (req, res) => {
  try {
    if (!tokens) {
      return res.status(401).json({ 
        error: '인증이 필요합니다',
        authenticated: false
      });
    }
    
    // 토큰 설정
    oauth2Client.setCredentials(tokens);
    
    // Gmail 클라이언트 생성
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 메시지 목록 가져오기 (최대 50개)
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50
    });
    
    const messages = response.data.messages || [];
    
    // 메시지 상세 정보 가져오기
    const messageDetails = await Promise.all(
      messages.slice(0, 20).map(async (message) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date']
          });
          
          const headers = details.data.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || '(제목 없음)';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          
          return {
            id: message.id,
            threadId: message.threadId,
            subject,
            from,
            date: new Date(date).toISOString(),
            snippet: details.data.snippet,
            isRead: !(details.data.labelIds || []).includes('UNREAD')
          };
        } catch (error) {
          console.error(`메시지 ${message.id} 상세 정보 가져오기 오류:`, error);
          return {
            id: message.id,
            error: error.message
          };
        }
      })
    );
    
    res.json(messageDetails);
  } catch (error) {
    console.error('Gmail 메시지 목록 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 메시지 상세 정보 가져오기
router.get('/messages/:messageId', async (req, res) => {
  try {
    if (!tokens) {
      return res.status(401).json({ 
        error: '인증이 필요합니다',
        authenticated: false
      });
    }
    
    const { messageId } = req.params;
    console.log('메시지 상세 정보 요청:', messageId);
    console.log('현재 사용 중인 토큰 정보:', JSON.stringify({
      access_token: tokens.access_token ? '존재함(상세 숨김)' : '없음',
      refresh_token: tokens.refresh_token ? '존재함(상세 숨김)' : '없음',
      scope: tokens.scope || '스코프 정보 없음',
      expiry_date: tokens.expiry_date || '만료일 정보 없음'
    }));
    
    // 토큰 설정
    oauth2Client.setCredentials(tokens);
    
    // Gmail 클라이언트 생성
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 메시지 내용 가져오기 시도 순서: 
    // 1) minimal, 2) raw, 3) full, 4) metadata
    let message;
    let errorMessage = '';
    let bodyContent = '';
    let bodyType = 'text/plain';
    
    // 1. minimal 형식으로 시도
    try {
      console.log('minimal 형식으로 메시지 요청 시도...');
      message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'minimal'
      });
      console.log('minimal 형식 가져오기 성공!');
      
      // minimal 형식은 기본 정보만 포함하므로 추가 요청 필요
      console.log('메타데이터와 함께 추가 상세 정보 요청...');
      message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata', 
        metadataHeaders: ['From', 'Subject', 'Date', 'To', 'Cc', 'Content-Type']
      });
      console.log('메타데이터 가져오기 성공!');
      
      // 메타데이터 성공 후 본문 내용을 가져오기 위해 full 형식 시도
      try {
        console.log('본문 내용을 가져오기 위해 full 형식으로 시도...');
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full'
        });
        console.log('full 형식 가져오기 성공!');
        
        // 헤더 정보는 유지하고 페이로드 정보만 업데이트
        message.data.payload = fullMessage.data.payload;
      } catch (fullError) {
        console.error('full 형식 가져오기 실패:', fullError.message);
        errorMessage += 'full 형식 실패: ' + fullError.message + '; ';
        
        // full 형식이 실패하면 raw 형식 시도
        try {
          console.log('raw 형식으로 시도...');
          const rawMessage = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'raw'
          });
          console.log('raw 형식 가져오기 성공!');
          
          // raw 형식에서 본문 파싱
          const rawContent = Buffer.from(rawMessage.data.raw, 'base64').toString('utf-8');
          
          // 헤더와 본문 분리
          const parts = rawContent.split('\r\n\r\n');
          const rawHeaders = parts[0];
          bodyContent = parts.slice(1).join('\r\n\r\n');
          
          // 헤더에서 Content-Type 추출
          const contentTypeMatch = rawHeaders.match(/Content-Type: ([^;]+)/i);
          if (contentTypeMatch) {
            bodyType = contentTypeMatch[1].trim();
          }
          
          console.log(`raw 데이터에서 본문 추출 성공 - 유형: ${bodyType}, 길이: ${bodyContent.length} 글자`);
        } catch (rawError) {
          console.error('raw 형식 가져오기 실패:', rawError.message);
          errorMessage += 'raw 형식 실패: ' + rawError.message + '; ';
          console.log('본문을 가져오기 위한 모든 시도가 실패했습니다. 메타데이터만 표시합니다.');
        }
      }
      
      // 이후에 본문 내용을 별도로 추출 시도
    } catch (minimalError) {
      console.error('minimal 형식 가져오기 실패:', minimalError.message);
      errorMessage += 'minimal 형식 실패: ' + minimalError.message + '; ';
      
      // 2. raw 형식으로 시도
      try {
        console.log('raw 형식으로 시도 중...');
        message = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'raw'
        });
        console.log('raw 형식 가져오기 성공!');
        
        // raw 형식에서 본문 파싱하기
        try {
          const rawContent = Buffer.from(message.data.raw, 'base64').toString('utf-8');
          
          // 헤더와 본문 분리
          const parts = rawContent.split('\r\n\r\n');
          const headers = parts[0];
          bodyContent = parts.slice(1).join('\r\n\r\n');
          
          // 헤더에서 Content-Type 추출
          const contentTypeMatch = headers.match(/Content-Type: ([^;]+)/i);
          if (contentTypeMatch) {
            bodyType = contentTypeMatch[1].trim();
          }
          
          console.log(`본문 추출 성공 - 유형: ${bodyType}, 길이: ${bodyContent.length} 글자`);
        } catch (parseError) {
          console.error('raw 데이터 파싱 실패:', parseError.message);
          bodyContent = '이메일 본문을 파싱하는 중 오류가 발생했습니다.';
        }
      } catch (rawError) {
        console.error('raw 형식 가져오기 실패:', rawError.message);
        errorMessage += 'raw 형식 실패: ' + rawError.message + '; ';
        
        // 3. full 형식으로 시도 (이전 시도들이 모두 실패한 경우)
        try {
          console.log('full 형식으로 시도 중 (마지막 시도)...');
          message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
          });
          console.log('full 형식 가져오기 성공!');
        } catch (fullError) {
          console.error('full 형식 가져오기 실패:', fullError.message);
          errorMessage += 'full 형식 실패: ' + fullError.message + '; ';
          
          // 4. 마지막으로 메타데이터만 가져오기
          console.log('모든 시도가 실패했습니다. 메타데이터만 가져옵니다...');
          message = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date', 'To', 'Cc', 'Content-Type']
          });
          console.log('메타데이터만 가져오기 성공');
          
          // 메타데이터만 있는 경우 본문 대신 오류 메시지 표시
          bodyContent = '이메일 본문을 가져올 수 없습니다. 권한 부족 또는 API 제한으로 인해 내용을 표시할 수 없습니다.';
        }
      }
    }
    
    // 헤더 정보 추출
    const headers = message.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '(제목 없음)';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const to = headers.find(h => h.name === 'To')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // 메시지 본문 파싱 (bodyContent가 이미 설정되지 않은 경우에만)
    if (!bodyContent && message.data.payload) {
      // 재귀적으로 파트 탐색하는 함수
      const findBodyContent = (part) => {
        // HTML 형식이 있으면 HTML 우선
        if (part.mimeType === 'text/html' && part.body && part.body.data) {
          bodyContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
          bodyType = 'text/html';
          return true;
        }
        // 텍스트 형식이 있고 아직 HTML을 찾지 못했으면 텍스트 저장
        else if (part.mimeType === 'text/plain' && part.body && part.body.data && bodyType !== 'text/html') {
          bodyContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
          bodyType = 'text/plain';
          return true;
        }
        // 자식 파트가 있으면 재귀 탐색
        else if (part.parts && Array.isArray(part.parts)) {
          for (const childPart of part.parts) {
            if (findBodyContent(childPart)) {
              return true;
            }
          }
        }
        return false;
      };
      
      // 메시지 페이로드에서 본문 찾기
      if (message.data.payload.parts && Array.isArray(message.data.payload.parts)) {
        // 멀티파트 메시지에서 본문 찾기
        findBodyContent(message.data.payload);
      } else if (message.data.payload.body && message.data.payload.body.data) {
        // 단일 파트 메시지에서 본문 찾기
        bodyContent = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
        bodyType = message.data.payload.mimeType || 'text/plain';
      }
    }
    
    // 본문 길이 확인
    console.log(`최종 본문 유형: ${bodyType}, 길이: ${bodyContent?.length || 0} 글자`);
    
    // 권한 관련 오류가 있었는지 확인
    const needReauth = errorMessage.includes('Metadata scope') || !bodyContent;
    
    // 응답 데이터 구성
    res.json({
      id: message.data.id,
      threadId: message.data.threadId,
      subject,
      from,
      to,
      date: new Date(date).toISOString(),
      snippet: message.data.snippet || '',
      body: bodyContent || '이메일 내용을 가져올 수 없습니다.',
      isRead: !(message.data.labelIds || []).includes('UNREAD'),
      labelIds: message.data.labelIds || [],
      bodyType,
      errorInfo: errorMessage || undefined,
      needReauth: needReauth
    });
  } catch (error) {
    console.error('Gmail 메시지 상세 정보 가져오기 오류:', error);
    console.error('오류 상세 정보:', error?.errors?.[0]?.message || '알 수 없는 오류');
    
    // 인증 오류인 경우
    if (error.message.includes('invalid_grant') || error.message.includes('Invalid Credentials')) {
      // 토큰 제거
      tokens = null;
      return res.status(401).json({ 
        error: '인증이 만료되었습니다. 다시 인증해주세요.',
        authenticated: false,
        needReauth: true
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      errorDetails: error?.errors?.[0]?.message || '알 수 없는 오류',
      needReauth: true
    });
  }
});

module.exports = router; 