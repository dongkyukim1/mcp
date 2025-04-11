const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('프록시 설정 적용 중...');
  
  // 모든 /api 경로 요청을 백엔드 서버로 프록시
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    pathRewrite: { 
      '^/api': '/api'  // 경로 재작성 없음, 그대로 유지
    },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[프록시] 요청: ${req.method} ${req.url} -> ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[프록시] 응답: ${proxyRes.statusCode} ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[프록시] 오류: ${req.method} ${req.url}`, err.message);
    }
  });
  
  app.use('/api', apiProxy);
  
  console.log('프록시 설정 완료: /api/* -> http://localhost:5000/api/*');
}; 