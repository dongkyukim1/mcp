const dotenv = require('dotenv');
const path = require('path');

// .env 파일 명시적으로 로드
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 환경 변수 디버깅
console.log('======= 환경 변수 확인 =======');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? '설정됨 ✓' : '설정안됨 ✗');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '설정됨 ✓' : '설정안됨 ✗');
console.log('================================');

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// 환경 변수 설정
const NODE_ENV = process.env.NODE_ENV || 'development';

// 라우터 불러오기
const slackRouter = require('./routes/slack');
const gmailRouter = require('./routes/gmail');
const figmaRouter = require('./routes/figma');
const githubRouter = require('./routes/github');
const notionRouter = require('./routes/notion');
const authRouter = require('./routes/auth');
const driveRouter = require('./routes/drive');

const app = express();
const PORT = process.env.PORT || 5000;

// 서버 상태 및 환경 정보 로깅
console.log('====== MCP 백엔드 서버 시작 ======');
console.log(`환경: ${NODE_ENV}`);
console.log(`포트: ${PORT}`);

// 피그마 설정 정보 출력
console.log('피그마 설정 정보:');
console.log(`- 클라이언트 ID 설정 여부: ${!!process.env.FIGMA_CLIENT_ID}`);
console.log(`- 시크릿 설정 여부: ${!!process.env.FIGMA_CLIENT_SECRET}`);
console.log(`- 리디렉션 URI: ${process.env.FIGMA_REDIRECT_URI || 'http://localhost:3000/auth/figma/callback'}`);

// 미들웨어 설정
app.use(cors({
  origin: NODE_ENV === 'production' ? ['https://yourapp.com', 'http://localhost:3000'] : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} 요청 시작 (IP: ${req.ip})`);
  console.log(`  헤더: ${JSON.stringify({
    'user-agent': req.headers['user-agent'],
    'content-type': req.headers['content-type'],
    'origin': req.headers['origin'],
    'referer': req.headers['referer']
  })}`);
  
  if (req.method !== 'GET' && req.body) {
    console.log(`  본문: ${JSON.stringify(req.body)}`);
  }
  
  // 응답 완료 후 로깅
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} 응답 완료 - 상태: ${res.statusCode}, 소요시간: ${duration}ms`);
  });
  
  next();
});

// 서버 상태 확인 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API 라우트 설정 (/api 접두사 있는 버전)
app.use('/api/slack', slackRouter);
app.use('/api/gmail', gmailRouter);
app.use('/api/figma', figmaRouter);
app.use('/api/github', githubRouter);
app.use('/api/notion', notionRouter);
app.use('/api/auth', authRouter);
app.use('/api/drive', driveRouter);

// API 라우트 설정 (/api 접두사 없는 버전) - 동일한 라우터 재사용
app.use('/slack', slackRouter);
app.use('/gmail', gmailRouter);
app.use('/figma', figmaRouter);
app.use('/github', githubRouter);
app.use('/notion', notionRouter);
app.use('/auth', authRouter);
app.use('/drive', driveRouter);

// 모든 환경에서 SPA 리디렉션 설정
// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../../client/build')));

// API 라우트가 먼저 실행된 후, 매칭되지 않은 모든 요청은 React 앱으로 전달
app.get('*', (req, res) => {
  // API 경로가 아닌 경우에만 index.html로 리디렉션
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

// 404 Not Found 핸들러
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} 엔드포인트를 찾을 수 없습니다.`
  });
});

// 오류 핸들러
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: err.message
  });
});

// 설정 API 엔드포인트
app.post('/api/settings', (req, res) => {
  try {
    const { theme, notifications, dashboard, services } = req.body;
    
    // 설정 저장 처리 (실제로는 데이터베이스에 저장)
    // 여기서는 간단히 콘솔에 로그만 출력
    console.log('사용자 설정 저장 요청:', {
      theme,
      notifications,
      dashboard,
      services
    });
    
    // 성공 응답
    res.json({ 
      success: true, 
      message: '설정이 성공적으로 저장되었습니다.',
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('설정 저장 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '설정을 저장하는 중 오류가 발생했습니다.' 
    });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    // 실제로는 데이터베이스나 사용자 세션에서 설정을 가져와야 함
    // 여기서는 더미 데이터 반환
    res.json({
      theme: 'light',
      notifications: {
        pushEnabled: true,
        emailEnabled: false,
        frequency: 'realtime'
      },
      dashboard: {
        showRecentActivities: true,
        autoRefresh: false,
        layout: 'grid'
      },
      services: [
        { id: 'notion', enabled: true, connected: true },
        { id: 'github', enabled: true, connected: true },
        { id: 'gmail', enabled: true, connected: true },
        { id: 'drive', enabled: true, connected: true },
        { id: 'sheets', enabled: true, connected: true },
        { id: 'slack', enabled: false, connected: false },
        { id: 'discord', enabled: false, connected: false }
      ]
    });
  } catch (error) {
    console.error('설정 조회 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '설정을 조회하는 중 오류가 발생했습니다.' 
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log('====== 서버 준비 완료 ======');
}); 