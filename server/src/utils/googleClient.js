const { google } = require('googleapis');
const dotenv = require('dotenv');

// .env 파일 로드
dotenv.config();

// OAuth 클라이언트 생성
const createOAuthClient = (redirectUri) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const defaultRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/auth/callback';
  // 파라미터로 전달된 redirectUri가 있으면 그것을 사용, 없으면 기본값 사용
  const finalRedirectUri = redirectUri || defaultRedirectUri;
  
  console.log('Google OAuth 클라이언트 설정:');
  console.log(`- 클라이언트 ID: ${clientId.substring(0, 10)}...`);
  console.log(`- 클라이언트 시크릿: ${clientSecret.substring(0, 5)}...`);
  console.log(`- 리디렉션 URI: ${finalRedirectUri}`);
  
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    finalRedirectUri
  );
};

// 구글 서비스 계정을 위한 더미 함수
// 현재는 OAuth 방식으로 변경했으므로 사용하지 않음
const initializeGoogleClients = async () => {
  throw new Error('서비스 계정 방식에서 OAuth 방식으로 변경되었습니다. OAuth 클라이언트를 사용하세요.');
};

module.exports = {
  createOAuthClient,
  initializeGoogleClients
}; 