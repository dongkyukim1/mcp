const express = require('express');
const axios = require('axios');
const router = express.Router();


const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID;
const FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET;
const FIGMA_REDIRECT_URI = process.env.FIGMA_REDIRECT_URI || 'http://localhost:3000/auth/figma/callback';
const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';

// 환경 변수 확인 로깅
console.log('피그마 설정 정보:');
console.log('- 클라이언트 ID 설정 여부:', !!FIGMA_CLIENT_ID);
console.log('- 시크릿 설정 여부:', !!FIGMA_CLIENT_SECRET);
console.log('- 리디렉션 URI:', FIGMA_REDIRECT_URI);

// 인증 상태 확인
router.get('/auth-status', (req, res) => {
  const token = req.session?.figmaToken;
  
  if (token) {
    // 토큰이 있는 경우 인증된 상태
    res.json({
      isAuthenticated: true,
      expiresAt: req.session?.figmaTokenExpiresAt
    });
  } else {
    // 토큰이 없는 경우 인증되지 않은 상태
    res.json({
      isAuthenticated: false
    });
  }
});

// OAuth 인증 URL 생성
router.get('/auth-url', (req, res) => {
  // 세션에 상태 저장
  const state = 'mcp-figma-' + Date.now();
  req.session.figmaAuthState = state;
  
  // URL 인코딩
  const encodedRedirectUri = encodeURIComponent(FIGMA_REDIRECT_URI);
  
  // 피그마 인증 URL 생성 (표준 OAuth 프로세스)
  const authUrl = `https://www.figma.com/oauth?client_id=${FIGMA_CLIENT_ID}&redirect_uri=${encodedRedirectUri}&scope=file_read&state=${state}&response_type=code`;
  
  console.log('피그마 인증 URL 생성 완료');
  
  // 인증 URL 반환
  res.json({ 
    authUrl,
    state
  });
});

// OAuth 콜백 처리
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    console.log(`피그마 인증 콜백 - 요청 받음: code=${code ? '있음' : '없음'}, state=${state || 'N/A'}`);
    
    // 코드가 없는 경우 처리
    if (!code) {
      return res.status(400).json({ 
        error: '인증 코드가 누락되었습니다.',
        success: false
      });
    }
    
    // 실제 OAuth 인증 처리
    console.log('피그마 액세스 토큰 요청 중...');
    
    try {
      const tokenResponse = await axios.post('https://api.figma.com/v1/oauth/token', {
        client_id: FIGMA_CLIENT_ID,
        client_secret: FIGMA_CLIENT_SECRET,
        redirect_uri: FIGMA_REDIRECT_URI,
        code: code,
        grant_type: 'authorization_code'
      });
      
      console.log('피그마 액세스 토큰 수신 성공:', tokenResponse.status);
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // 만료 시간 설정
      const expiresAt = Date.now() + (expires_in || 3600) * 1000;
      
      // 세션에 토큰 저장
      req.session.figmaToken = access_token;
      req.session.figmaRefreshToken = refresh_token;
      req.session.figmaTokenExpiresAt = expiresAt;
      
      // 세션 저장
      return req.session.save((err) => {
        if (err) {
          console.error('세션 저장 오류:', err);
          return res.status(500).json({ 
            error: '세션 저장 중 오류가 발생했습니다.', 
            success: false 
          });
        }
        
        return res.json({
          success: true,
          expiresAt,
          message: '피그마 인증이 완료되었습니다.'
        });
      });
    } catch (error) {
      console.error('피그마 인증 오류:', error.message);
      return res.status(500).json({
        error: '인증 처리 중 오류가 발생했습니다.',
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    console.error('피그마 콜백 처리 중 일반 오류:', error);
    return res.status(500).json({
      error: '인증 처리 중 오류가 발생했습니다.',
      success: false,
      message: error.message
    });
  }
});

// 토큰 갱신
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.session?.figmaRefreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: '리프레시 토큰이 없습니다. 다시 로그인해주세요.' });
  }
  
  try {
    const tokenResponse = await axios.post('https://api.figma.com/v1/oauth/refresh', {
      client_id: FIGMA_CLIENT_ID,
      client_secret: FIGMA_CLIENT_SECRET,
      refresh_token: refreshToken
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = Date.now() + expires_in * 1000;
    
    req.session.figmaToken = access_token;
    req.session.figmaRefreshToken = refresh_token || refreshToken;
    req.session.figmaTokenExpiresAt = expiresAt;
    
    res.json({
      success: true,
      expiresAt
    });
  } catch (error) {
    console.error('Figma 토큰 갱신 오류:', error.response?.data || error.message);
    res.status(500).json({
      error: '토큰 갱신 중 오류가 발생했습니다.',
      details: error.response?.data || error.message
    });
  }
});

// 사용자 정보 가져오기
router.get('/me', async (req, res) => {
  const token = req.session?.figmaToken;
  
  if (!token) {
    return res.status(401).json({ error: '인증되지 않았습니다.' });
  }
  
  try {
    // 실제 Figma API 호출
    const response = await axios.get(`${FIGMA_API_BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Figma 사용자 정보 조회 오류:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: '사용자 정보를 가져오는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 파일 목록 가져오기
router.get('/files', async (req, res) => {
  const token = req.session?.figmaToken;
  
  if (!token) {
    return res.status(401).json({ error: '인증되지 않았습니다.' });
  }
  
  try {
    // 사용자가 제공한 팀 프로젝트 ID로 직접 접근
    const projectId = '349941637';
    
    console.log(`프로젝트 ID ${projectId}에서 파일 가져오기 시도...`);
    
    // 이 프로젝트의 파일 가져오기
    const projectFilesResponse = await axios.get(`${FIGMA_API_BASE_URL}/projects/${projectId}/files`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const files = projectFilesResponse.data.files || [];
    console.log(`프로젝트에서 ${files.length}개 파일을 찾았습니다.`);
    
    // 결과 반환
    return res.json({
      files: files,
      source: 'project-files'
    });
  } catch (error) {
    console.error('피그마 API 오류:', error.message);
    
    // 최근 파일 시도
    try {
      const recentFilesResponse = await axios.get(`${FIGMA_API_BASE_URL}/me/files/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const recentFiles = recentFilesResponse.data.files || [];
      console.log(`최근 파일 ${recentFiles.length}개를 찾았습니다.`);
      
      return res.json({
        files: recentFiles,
        source: 'recent-files'
      });
    } catch (recentErr) {
      console.error('최근 파일 가져오기 실패:', recentErr.message);
      
      return res.json({
        files: filesWithDetails,
        source: 'fallback-data',
        message: '피그마 API 연결에 실패했습니다. 기본 데이터를 표시합니다.'
      });
    }
  }
});

// 파일 세부 정보 가져오기
router.get('/files/:file_key', async (req, res) => {
  const token = req.session?.figmaToken;
  const { file_key } = req.params;
  
  if (!token) {
    return res.status(401).json({ error: '인증되지 않았습니다.' });
  }
  
  try {
    // 파일 정보 가져오기
    const fileResponse = await axios.get(`${FIGMA_API_BASE_URL}/files/${file_key}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 댓글 정보 가져오기
    let comments = [];
    try {
      const commentsResponse = await axios.get(`${FIGMA_API_BASE_URL}/files/${file_key}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      comments = commentsResponse.data.comments || [];
    } catch (commentsErr) {
      console.error('댓글 가져오기 실패:', commentsErr.message);
    }
    
    // 응답 데이터 구성
    const fileData = {
      key: file_key,
      name: fileResponse.data.name,
      last_modified: fileResponse.data.last_modified,
      thumbnail_url: `https://www.figma.com/thumbnail/${file_key}`,
      directThumbnailUrl: `https://www.figma.com/thumbnail/${file_key}`,
      description: fileResponse.data.description,
      comments: comments
    };
    
    res.json(fileData);
  } catch (error) {
    console.error('Figma 파일 상세 조회 오류:', error.message);
    res.status(500).json({ 
      error: '파일 정보를 가져오는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 최근 알림 가져오기
router.get('/notifications', async (req, res) => {
  const token = req.session?.figmaToken;
  
  if (!token) {
    return res.status(401).json({ error: '인증되지 않았습니다.' });
  }
  
  try {
    // 사용자 정보 가져오기
    const userResponse = await axios.get(`${FIGMA_API_BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const userData = userResponse.data;
    
    // 알림 API가 없으므로 빈 배열 반환
    // 피그마 API에는 알림을 직접 가져오는 기능이 없어 구현 불가능
    res.json({ 
      notifications: [],
      user: userData,
      message: '피그마 API에서는 알림 정보를 제공하지 않습니다.'
    });
  } catch (error) {
    console.error('Figma API 오류:', error.message);
    res.status(500).json({
      error: '알림을 가져오는 중 오류가 발생했습니다.',
      notifications: [],
      message: error.message
    });
  }
});

module.exports = router; 