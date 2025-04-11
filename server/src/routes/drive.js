const express = require('express');
const { google } = require('googleapis');
const { createOAuthClient } = require('../utils/googleClient');
const router = express.Router();

// 스코프 정의
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

// 드라이브 API 인증 URL 생성
router.get('/auth', (req, res) => {
  try {
    // 드라이브용 콜백 URL 설정
    const redirectUri = process.env.DRIVE_REDIRECT_URI || 'http://localhost:5000/api/drive/auth/callback';
    const oauth2Client = createOAuthClient(redirectUri);
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      // 필요에 따라 state 추가 가능
      state: req.query.state || '',
      prompt: 'consent'
    });
    
    console.log(`드라이브 인증 URL 생성: ${authUrl}`);
    res.json({ authUrl });
  } catch (error) {
    console.error('드라이브 인증 URL 생성 실패:', error);
    res.status(500).json({ error: '인증 URL 생성 중 오류가 발생했습니다.' });
  }
});

// OAuth 콜백 처리
router.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({ error: '인증 코드가 없습니다.' });
  }
  
  try {
    // 드라이브용 콜백 URL 설정
    const redirectUri = process.env.DRIVE_REDIRECT_URI || 'http://localhost:5000/api/drive/auth/callback';
    const oauth2Client = createOAuthClient(redirectUri);
    
    // 인증 코드로 토큰 교환
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // 토큰 저장 (실제 구현에서는 데이터베이스에 저장하거나 세션에 저장해야 함)
    // 임시로 메모리에 저장 (이 방식은 프로덕션에서는 사용하지 말 것)
    req.app.locals.driveTokens = tokens;
    
    console.log('드라이브 인증 성공, 토큰 발급됨');
    
    // 클라이언트로 리디렉션
    res.redirect('/drive?auth=success');
  } catch (error) {
    console.error('드라이브 인증 콜백 처리 실패:', error);
    res.redirect('/drive?auth=error');
  }
});

// 인증 상태 확인
router.get('/auth-status', (req, res) => {
  const tokens = req.app.locals.driveTokens;
  
  if (!tokens) {
    return res.json({ isAuthenticated: false });
  }
  
  // 토큰 만료 확인
  const isExpired = tokens.expiry_date && tokens.expiry_date <= Date.now();
  
  if (isExpired) {
    return res.json({ 
      isAuthenticated: false,
      reason: 'token_expired'
    });
  }
  
  res.json({ isAuthenticated: true });
});

// 파일 목록 가져오기
router.get('/files', async (req, res) => {
  const tokens = req.app.locals.driveTokens;
  
  if (!tokens) {
    return res.status(401).json({ error: '인증되지 않았습니다. 드라이브에 연결하세요.' });
  }
  
  try {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(tokens);
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // 파일 목록 조회 (파일만 가져옴)
    const response = await drive.files.list({
      q: "mimeType != 'application/vnd.google-apps.folder'",
      fields: 'files(id, name, mimeType, size, modifiedTime, shared)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });
    
    // 응답 포맷 변환
    const files = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      type: getFileType(file.mimeType),
      size: formatFileSize(file.size),
      modified: new Date(file.modifiedTime).toLocaleDateString(),
      shared: file.shared || false
    }));
    
    res.json(files);
  } catch (error) {
    console.error('드라이브 파일 목록 조회 실패:', error);
    res.status(500).json({ error: '파일 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 폴더 목록 가져오기
router.get('/folders', async (req, res) => {
  const tokens = req.app.locals.driveTokens;
  
  if (!tokens) {
    return res.status(401).json({ error: '인증되지 않았습니다. 드라이브에 연결하세요.' });
  }
  
  try {
    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(tokens);
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // 폴더 목록 조회
    const response = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder'",
      fields: 'files(id, name, modifiedTime, shared)',
      orderBy: 'modifiedTime desc',
      pageSize: 20
    });
    
    // 각 폴더의 항목 수를 가져오는 프로미스 배열 생성
    const folderPromises = response.data.files.map(async folder => {
      const childResponse = await drive.files.list({
        q: `'${folder.id}' in parents`,
        fields: 'files(id)',
        pageSize: 1000
      });
      
      return {
        id: folder.id,
        name: folder.name,
        items: childResponse.data.files.length,
        modified: new Date(folder.modifiedTime).toLocaleDateString(),
        shared: folder.shared || false
      };
    });
    
    // 모든 폴더 정보 병렬로 가져오기
    const folders = await Promise.all(folderPromises);
    
    res.json(folders);
  } catch (error) {
    console.error('드라이브 폴더 목록 조회 실패:', error);
    res.status(500).json({ error: '폴더 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 알림 카운트 가져오기 (임시 구현)
router.get('/notifications/count', (req, res) => {
  // 실제 구현에서는 실제 알림 데이터를 가져와야 함
  // 임시로 랜덤한 수를 반환
  const count = Math.floor(Math.random() * 5);
  res.json({ count });
});

// 파일 유형 가져오기
function getFileType(mimeType) {
  if (mimeType.includes('image/')) {
    return 'image';
  } else if (mimeType.includes('video/')) {
    return 'video';
  } else if (mimeType.includes('audio/')) {
    return 'audio';
  } else if (mimeType.includes('pdf')) {
    return 'pdf';
  } else if (
    mimeType.includes('document') || 
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('msword') ||
    mimeType.includes('officedocument')
  ) {
    return 'document';
  } else {
    return 'file';
  }
}

// 파일 크기 형식화
function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) return 'N/A';
  
  const bytes = parseInt(sizeInBytes);
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
}

module.exports = router; 