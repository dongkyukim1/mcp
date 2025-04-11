const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 간단한 사용자 데이터 (실제 프로덕션에서는 데이터베이스를 사용해야 함)
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: '관리자',
    email: 'admin@example.com',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    name: '사용자',
    email: 'user@example.com',
    role: 'user'
  }
];

// 로그인
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 사용자 인증
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_random_secure_string_here',
      { expiresIn: '24h' }
    );
    
    // 민감한 정보를 제외한 사용자 정보 반환
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    res.json({
      message: '로그인 성공',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

// 현재 사용자 정보 가져오기
router.get('/me', (req, res) => {
  try {
    // 요청 헤더에서 토큰 가져오기
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 제공되지 않았습니다.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    jwt.verify(token, process.env.JWT_SECRET || 'your_random_secure_string_here', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      }
      
      // 토큰에서 사용자 ID 가져오기
      const userId = decoded.id;
      
      // 사용자 정보 조회
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
      
      // 민감한 정보를 제외한 사용자 정보 반환
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      res.json(userWithoutPassword);
    });
  } catch (error) {
    console.error('사용자 정보 가져오기 중 오류:', error);
    res.status(500).json({ message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 로그아웃 (클라이언트 측에서 토큰을 제거하기 때문에 서버에서는 별도 처리 없음)
router.post('/logout', (req, res) => {
  res.json({ message: '로그아웃 성공' });
});

// 간단한 설정 저장 엔드포인트
router.post('/settings', (req, res) => {
  // 여기서는 설정을 저장하지 않고 성공 응답만 반환
  res.json({ success: true, message: '설정이 저장되었습니다.' });
});

// 설정 가져오기 엔드포인트
router.get('/settings', (req, res) => {
  // 기본 설정 반환
  res.json({
    refreshInterval: 5,
    notifications: true,
    darkMode: false
  });
});

module.exports = router; 