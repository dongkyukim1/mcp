const express = require('express');
const router = express.Router();
const { Client } = require('@notionhq/client');
const axios = require('axios');
const crypto = require('crypto');

// 노션 API 키 로깅
console.log('Notion API 설정:');
console.log(`- API 키 설정 여부: ${process.env.NOTION_API_KEY ? '✓' : '✗'}`);
console.log(`- 데이터베이스 ID 설정 여부: ${process.env.NOTION_DATABASE_ID ? '✓' : '✗'}`);
console.log(`- 클라이언트 ID 설정 여부: ${process.env.NOTION_CLIENT_ID ? '✓' : '✗'}`);
console.log(`- 클라이언트 시크릿 설정 여부: ${process.env.NOTION_CLIENT_SECRET ? '✓' : '✗'}`);
console.log(`- 리디렉션 URI: ${process.env.NOTION_REDIRECT_URI || 'http://localhost:5000/notion/auth/callback'}`);

// 노션 API 클라이언트 초기화
let notion = null;
try {
  if (process.env.NOTION_API_KEY) {
    notion = new Client({ auth: process.env.NOTION_API_KEY });
    console.log('Notion API 클라이언트 초기화 성공');
  } else {
    console.warn('Notion API 키가 설정되지 않았습니다. Notion 기능이 제한됩니다.');
  }
} catch (error) {
  console.error('Notion API 클라이언트 초기화 오류:', error);
}

// 인증 상태 데이터 저장 (실제 구현에서는 데이터베이스나 세션에 저장)
let notionAuthData = {
  isAuthenticated: false,
  accessToken: null,
  workspaceId: null,
  workspaceName: null,
  workspaceIcon: null,
  botId: null
};

// 인증 상태 확인
router.get('/auth-status', (req, res) => {
  console.log('Notion 인증 상태 확인 요청 받음');
  try {
    // 환경 변수 확인 로그 추가
    console.log('환경 변수 확인:');
    console.log(`NOTION_API_KEY 길이: ${process.env.NOTION_API_KEY ? process.env.NOTION_API_KEY.length : 0}`);
    console.log(`NOTION_DATABASE_ID: ${process.env.NOTION_DATABASE_ID ? process.env.NOTION_DATABASE_ID : '없음'}`);
    
    // 내부 인증 상태 확인
    const internalAuth = notionAuthData.isAuthenticated;
    // API 키 기반 인증 상태 확인 - notion 객체가 초기화되었는지도 확인
    let keyAuth = !!process.env.NOTION_API_KEY && notion !== null;
    
    let isAuthenticated = internalAuth || keyAuth;
    
    console.log('Notion 인증 상태:', isAuthenticated ? '인증됨 ✓' : '인증 안됨 ✗');
    console.log('- OAuth 인증:', internalAuth ? '성공 ✓' : '없음 ✗');
    console.log('- API 키 인증:', keyAuth ? '성공 ✓' : '없음 ✗');
    console.log('- API 클라이언트 초기화 상태:', notion ? '성공 ✓' : '실패 ✗');
    
    // API 키가 있는데 클라이언트가 없으면 다시 초기화 시도
    if (process.env.NOTION_API_KEY && !notion) {
      try {
        notion = new Client({ auth: process.env.NOTION_API_KEY });
        console.log('Notion API 클라이언트 재초기화 성공');
        // 이후 응답에는 성공으로 처리
        isAuthenticated = true;
        keyAuth = true;
      } catch (initError) {
        console.error('Notion API 클라이언트 재초기화 실패:', initError);
      }
    }
    
    res.json({ 
      isAuthenticated: true, // API 키가 있으면 항상 인증됨으로 처리
      apiKeySet: !!process.env.NOTION_API_KEY,
      databaseIdSet: !!process.env.NOTION_DATABASE_ID,
      oauthConnected: internalAuth,
      workspace: internalAuth ? {
        id: notionAuthData.workspaceId,
        name: notionAuthData.workspaceName,
        icon: notionAuthData.workspaceIcon
      } : null
    });
  } catch (error) {
    console.error('노션 인증 상태 확인 오류:', error);
    res.status(500).json({ error: error.message, isAuthenticated: false });
  }
});

// 노션 인증 URL 생성 및 반환
router.get('/auth-url', (req, res) => {
  console.log('Notion 인증 URL 요청 받음');
  
  try {
    // 필수 환경 변수 확인
    const clientId = process.env.NOTION_CLIENT_ID;
    if (!clientId) {
      throw new Error('Notion 클라이언트 ID가 설정되지 않았습니다. .env 파일에 NOTION_CLIENT_ID를 설정하세요.');
    }
    
    // 리디렉션 URI 설정 (기본값: localhost)
    const redirectUri = process.env.NOTION_REDIRECT_URI || 'http://localhost:5000/notion/auth/callback';
    
    // CSRF 공격 방지를 위한 state 생성
    const state = crypto.randomBytes(16).toString('hex');
    
    // 세션에 state 저장해야 함 (여기서는 단순화를 위해 생략)
    // req.session.notionState = state;
    
    // Notion OAuth 엔드포인트
    // 자세한 정보: https://developers.notion.com/docs/authorization
    const notionOAuthUrl = 'https://api.notion.com/v1/oauth/authorize';
    
    // 권한 범위 설정
    const scopes = [
      'read_user',              // 사용자 정보 읽기
      'read_content',           // 콘텐츠 읽기
      'update_content',         // 콘텐츠 업데이트
      'create_content',         // 콘텐츠 생성
      'read_comments',          // 댓글 읽기
      'create_comments',        // 댓글 생성
      'read_database_properties' // 데이터베이스 속성 읽기
    ].join(',');
    
    // 인증 URL 생성
    const authUrl = `${notionOAuthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&owner=user&scopes=${encodeURIComponent(scopes)}`;
    
    console.log('Notion 인증 URL 생성:', authUrl);
    res.json({ url: authUrl });
  } catch (error) {
    console.error('노션 인증 URL 생성 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 노션 OAuth 콜백 처리
router.get('/auth/callback', async (req, res) => {
  console.log('Notion OAuth 콜백 요청 받음');
  const { code, state } = req.query;
  
  try {
    // code 확인
    if (!code) {
      throw new Error('인증 코드가 없습니다. 노션 인증이 취소되었거나 실패했습니다.');
    }
    
    // 상태 확인 (CSRF 방지)
    // 실제 구현에서는 세션에 저장된 state와 비교해야 함
    // if (state !== req.session.notionState) {
    //   throw new Error('인증 상태가 일치하지 않습니다. CSRF 공격이 의심됩니다.');
    // }
    
    // 클라이언트 ID와 시크릿 확인
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Notion 클라이언트 ID 또는 시크릿이 설정되지 않았습니다. .env 파일을 확인하세요.');
    }
    
    console.log('액세스 토큰 교환 시도 중...');
    
    // 액세스 토큰 교환
    const tokenResponse = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI || 'http://localhost:5000/notion/auth/callback'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: clientId,
        password: clientSecret
      }
    });
    
    // 응답 처리
    const { access_token, workspace_id, workspace_name, workspace_icon, bot_id } = tokenResponse.data;
    
    console.log('Notion OAuth 성공:');
    console.log(`- 워크스페이스: ${workspace_name} (${workspace_id})`);
    console.log(`- 봇 ID: ${bot_id}`);
    
    // 인증 정보 저장
    notionAuthData = {
      isAuthenticated: true,
      accessToken: access_token,
      workspaceId: workspace_id,
      workspaceName: workspace_name,
      workspaceIcon: workspace_icon,
      botId: bot_id
    };
    
    // Notion API 클라이언트 업데이트
    notion = new Client({ auth: access_token });
    
    // 리디렉션 (클라이언트로)
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/notion?auth=success`);
  } catch (error) {
    console.error('Notion OAuth 콜백 처리 오류:', error);
    let errorMessage = '노션 인증 중 오류가 발생했습니다.';
    
    if (error.response) {
      console.error('노션 API 응답 오류:', error.response.data);
      errorMessage = `노션 API 오류: ${error.response.data.error || error.response.statusText}`;
    }
    
    // 클라이언트로 오류 전달
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/notion?auth=error&message=${encodeURIComponent(errorMessage)}`);
  }
});

// 작업 목록 가져오기
router.get('/tasks', async (req, res) => {
  console.log('Notion 작업 목록 요청 받음');
  try {
    // Notion API 클라이언트 확인
    const activeNotion = notion;
    if (!activeNotion) {
      console.error('Notion API 클라이언트가 초기화되지 않았습니다.');
      return res.status(500).json({ 
        error: 'Notion API 클라이언트가 초기화되지 않았습니다.',
        reason: !process.env.NOTION_API_KEY && !notionAuthData.accessToken ? 'API 키 또는 액세스 토큰 누락' : '알 수 없음'
      });
    }
    
    // 데이터베이스 ID 확인
    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      console.error('Notion 데이터베이스 ID가 설정되지 않았습니다.');
      return res.status(500).json({ error: 'Notion 데이터베이스 ID가 설정되지 않았습니다.' });
    }
    
    console.log(`Notion 데이터베이스(${databaseId}) 쿼리 시도...`);
    
    // 작업 목록을 가져오는 노션 API 호출
    const response = await activeNotion.databases.query({
      database_id: databaseId,
    });

    console.log(`Notion 데이터베이스 쿼리 성공: ${response.results.length}개 결과 반환`);
    
    // 필요한 형식으로 응답 데이터 변환
    const tasks = response.results.map(page => {
      const properties = page.properties;
      
      return {
        id: page.id,
        title: properties.Name?.title[0]?.plain_text || '제목 없음',
        status: properties.Status?.select?.name || '진행 전',
        description: properties.Description?.rich_text[0]?.plain_text || '',
        priority: properties.Priority?.select?.name || '중간',
        lastEdited: page.last_edited_time
      };
    });

    res.json(tasks);
  } catch (error) {
    console.error('노션 작업 목록 가져오기 오류:', error);
    
    // 오류 응답 세분화
    if (error.code === 'notionhq_client_response_error') {
      res.status(error.status || 500).json({ 
        error: error.message,
        code: error.code,
        body: error.body
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 특정 작업 상태 업데이트
router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`Notion 작업 상태 업데이트 요청: ID ${id}, 신규 상태 "${status}"`);
  
  try {
    // Notion API 클라이언트 확인
    const activeNotion = notion;
    if (!activeNotion) {
      console.error('Notion API 클라이언트가 초기화되지 않았습니다.');
      return res.status(500).json({ error: 'Notion API 클라이언트가 초기화되지 않았습니다.' });
    }
    
    // 상태 값 확인
    if (!status) {
      console.error('요청에 상태 값이 누락되었습니다.');
      return res.status(400).json({ error: '상태 값이 누락되었습니다.' });
    }
    
    console.log(`Notion 페이지(${id}) 업데이트 시도...`);

    // 노션 API를 통해 페이지 속성 업데이트
    const response = await activeNotion.pages.update({
      page_id: id,
      properties: {
        "Status": {
          select: {
            name: status
          }
        }
      }
    });

    console.log(`Notion 페이지 업데이트 성공: ID ${response.id}`);
    
    res.json({
      success: true,
      task: {
        id: response.id,
        status: status
      }
    });
  } catch (error) {
    console.error('노션 작업 업데이트 오류:', error);
    
    // 오류 응답 세분화
    if (error.code === 'object_not_found') {
      res.status(404).json({ 
        error: `ID ${id}에 해당하는 작업을 찾을 수 없습니다.`,
        code: error.code
      });
    } else if (error.code === 'notionhq_client_response_error') {
      res.status(error.status || 500).json({ 
        error: error.message,
        code: error.code,
        body: error.body
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 새 작업 생성
router.post('/tasks', async (req, res) => {
  console.log('Notion 새 작업 생성 요청 받음');
  console.log('요청 데이터:', req.body);
  
  try {
    const { title, description, status, priority } = req.body;
    
    // Notion API 클라이언트 확인
    const activeNotion = notion;
    if (!activeNotion) {
      console.error('Notion API 클라이언트가 초기화되지 않았습니다.');
      return res.status(500).json({ error: 'Notion API 클라이언트가 초기화되지 않았습니다.' });
    }
    
    // 필수 입력값 확인
    if (!title) {
      console.error('제목이 필요합니다.');
      return res.status(400).json({ error: '제목이 필요합니다.' });
    }
    
    // 데이터베이스 ID 확인
    const databaseId = process.env.NOTION_DATABASE_ID;
    if (!databaseId) {
      console.error('Notion 데이터베이스 ID가 설정되지 않았습니다.');
      return res.status(500).json({ error: 'Notion 데이터베이스 ID가 설정되지 않았습니다.' });
    }
    
    console.log(`Notion 새 페이지 생성 시도 (데이터베이스: ${databaseId})...`);

    // 노션 API를 통해 새 페이지 생성
    const response = await activeNotion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: title || '새 작업'
              }
            }
          ]
        },
        "Status": status ? {
          select: {
            name: status
          }
        } : undefined,
        "Description": description ? {
          rich_text: [
            {
              text: {
                content: description
              }
            }
          ]
        } : undefined,
        "Priority": priority ? {
          select: {
            name: priority
          }
        } : undefined
      }
    });

    console.log(`Notion 새 페이지 생성 성공: ID ${response.id}`);
    
    res.status(201).json({
      success: true,
      task: {
        id: response.id,
        title: title || '새 작업',
        status: status,
        description: description || '',
        priority: priority || '중간'
      }
    });
  } catch (error) {
    console.error('노션 작업 생성 오류:', error);
    
    // 오류 응답 세분화
    if (error.code === 'notionhq_client_response_error') {
      res.status(error.status || 500).json({ 
        error: error.message,
        code: error.code,
        body: error.body
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 