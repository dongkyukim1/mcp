const express = require('express');
const router = express.Router();
const axios = require('axios');

// GitHub API 기본 URL
const GITHUB_API_URL = 'https://api.github.com';

// GitHub API 헤더 생성 함수
const getGitHubHeaders = () => {
  return {
    'Authorization': `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };
};

// 인증 상태 확인
router.get('/auth-status', async (req, res) => {
  try {
    // 토큰이 있는지 확인
    if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
      return res.json({ isAuthenticated: false });
    }

    // GitHub API로 현재 사용자 정보 요청
    const response = await axios.get(`${GITHUB_API_URL}/user`, {
      headers: getGitHubHeaders()
    });

    // 사용자 정보를 req 객체에 저장 (다른 API에서 사용할 수 있도록)
    req.githubUser = {
      id: response.data.id,
      username: response.data.login,
      name: response.data.name,
      avatar_url: response.data.avatar_url
    };

    res.json({
      isAuthenticated: true,
      user: req.githubUser
    });
  } catch (error) {
    console.error('GitHub 인증 상태 확인 오류:', error);
    res.json({ isAuthenticated: false, error: error.message });
  }
});

// 사용자 저장소 목록 가져오기
router.get('/repos', async (req, res) => {
  try {
    const response = await axios.get(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=10`, {
      headers: getGitHubHeaders()
    });

    const repos = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      updated_at: repo.updated_at
    }));

    res.json(repos);
  } catch (error) {
    console.error('GitHub 저장소 목록 가져오기 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 최근 커밋 목록 가져오기
router.get('/commits', async (req, res) => {
  try {
    const { repo = '' } = req.query;
    
    // 사용자 정보 가져오기
    let username = 'USER_NAME';
    
    try {
      const userResponse = await axios.get(`${GITHUB_API_URL}/user`, {
        headers: getGitHubHeaders()
      });
      username = userResponse.data.login;
    } catch (userError) {
      console.error('GitHub 사용자 정보 가져오기 오류:', userError);
      // 사용자 정보를 가져오지 못하더라도 계속 진행
    }
    
    let url;

    if (repo) {
      // 특정 저장소의 커밋 가져오기
      url = `${GITHUB_API_URL}/repos/${repo}/commits`;
    } else {
      // 사용자의 모든 이벤트 중 PushEvent를 필터링하여 커밋 정보 추출
      url = `${GITHUB_API_URL}/users/${username}/events`;
    }

    const response = await axios.get(url, {
      headers: getGitHubHeaders()
    });

    let commits;
    
    if (repo) {
      // 특정 저장소 커밋 형식 변환
      commits = response.data.map(commit => ({
        sha: commit.sha,
        html_url: commit.html_url,
        commit: {
          message: commit.commit.message,
          author: commit.commit.author
        },
        author: commit.author,
        repo: { name: repo }
      }));
    } else {
      // 모든 푸시 이벤트에서 커밋 추출
      commits = [];
      response.data.forEach(event => {
        if (event.type === 'PushEvent') {
          event.payload.commits.forEach(commit => {
            commits.push({
              sha: commit.sha,
              html_url: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
              commit: {
                message: commit.message,
                author: { name: commit.author.name, date: event.created_at }
              },
              repo: { name: event.repo.name }
            });
          });
        }
      });
    }

    res.json(commits.slice(0, 20)); // 최대 20개 반환
  } catch (error) {
    console.error('GitHub 커밋 목록 가져오기 오류:', error.response?.data || error.message);
    // 빈 배열 반환하여 프론트엔드 오류 방지
    res.json([]);
  }
});

// 풀 리퀘스트 목록 가져오기
router.get('/pull-requests', async (req, res) => {
  try {
    // 사용자 정보 가져오기
    let username = 'USER_NAME';
    
    try {
      const userResponse = await axios.get(`${GITHUB_API_URL}/user`, {
        headers: getGitHubHeaders()
      });
      username = userResponse.data.login;
    } catch (userError) {
      console.error('GitHub 사용자 정보 가져오기 오류:', userError);
      // 사용자 정보를 가져오지 못하더라도 계속 진행
    }
    
    console.log('GitHub API 호출 - 사용자:', username);
    
    // 사용자의 풀 리퀘스트 검색
    const response = await axios.get(`${GITHUB_API_URL}/search/issues?q=is:pr+author:${username}+is:open`, {
      headers: getGitHubHeaders()
    });

    const pullRequests = response.data.items.map(pr => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      html_url: pr.html_url,
      state: pr.state,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      user: {
        login: pr.user.login,
        avatar_url: pr.user.avatar_url
      },
      repository_url: pr.repository_url,
      comments: pr.comments
    }));

    res.json(pullRequests);
  } catch (error) {
    console.error('GitHub 풀 리퀘스트 목록 가져오기 오류:', error.response?.data || error.message);
    // 빈 배열 반환 (프론트엔드가 계속 작동하도록)
    res.json([]);
  }
});

// 이슈 목록 가져오기
router.get('/issues', async (req, res) => {
  try {
    const { repo, state = 'open' } = req.query;
    
    // 사용자 정보 가져오기
    let username = 'USER_NAME';
    
    try {
      const userResponse = await axios.get(`${GITHUB_API_URL}/user`, {
        headers: getGitHubHeaders()
      });
      username = userResponse.data.login;
    } catch (userError) {
      console.error('GitHub 사용자 정보 가져오기 오류:', userError);
      // 사용자 정보를 가져오지 못하더라도 계속 진행
    }
    
    let url;

    if (repo) {
      // 특정 저장소의 이슈 가져오기
      url = `${GITHUB_API_URL}/repos/${repo}/issues?state=${state}`;
    } else {
      // 사용자의 이슈 검색
      url = `${GITHUB_API_URL}/search/issues?q=is:issue+author:${username}+is:${state}`;
    }

    const response = await axios.get(url, {
      headers: getGitHubHeaders()
    });

    let issues;
    
    if (repo) {
      issues = response.data.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        html_url: issue.html_url,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        user: {
          login: issue.user.login,
          avatar_url: issue.user.avatar_url
        },
        comments: issue.comments,
        labels: issue.labels,
        repo: repo
      }));
    } else {
      issues = response.data.items.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        html_url: issue.html_url,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        user: {
          login: issue.user.login,
          avatar_url: issue.user.avatar_url
        },
        comments: issue.comments,
        labels: issue.labels,
        repo: issue.repository_url.replace('https://api.github.com/repos/', '')
      }));
    }

    res.json(issues);
  } catch (error) {
    console.error('GitHub 이슈 목록 가져오기 오류:', error.response?.data || error.message);
    // 빈 배열 반환하여 프론트엔드 오류 방지
    res.json([]);
  }
});

// 특정 저장소 정보 가져오기
router.get('/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
      headers: getGitHubHeaders()
    });

    const repoData = {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      html_url: response.data.html_url,
      language: response.data.language,
      stargazers_count: response.data.stargazers_count,
      forks_count: response.data.forks_count,
      open_issues_count: response.data.open_issues_count,
      watchers_count: response.data.watchers_count,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      default_branch: response.data.default_branch,
      owner: {
        login: response.data.owner.login,
        avatar_url: response.data.owner.avatar_url
      }
    };

    res.json(repoData);
  } catch (error) {
    console.error('GitHub 저장소 정보 가져오기 오류:', error.response?.data || error.message);
    
    // 저장소를 찾을 수 없는 경우 기본 정보 반환
    if (error.response?.status === 404) {
      const { owner, repo } = req.params;
      res.status(404).json({ 
        error: `저장소를 찾을 수 없습니다: ${owner}/${repo}`,
        name: repo,
        full_name: `${owner}/${repo}`,
        description: '저장소 정보를 가져올 수 없습니다.',
        default_branch: 'main',
        private: false,
        html_url: `https://github.com/${owner}/${repo}`,
        owner: {
          login: owner,
          avatar_url: ''
        }
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// 저장소 브랜치 목록 가져오기
router.get('/repos/:owner/:repo/branches', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    console.log(`브랜치 목록 요청: ${owner}/${repo}`);
    
    const response = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}/branches`, {
      headers: getGitHubHeaders()
    });

    const branches = response.data.map(branch => ({
      name: branch.name,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url
      },
      protected: branch.protected
    }));

    // 저장소 정보를 가져와 기본 브랜치 확인
    try {
      const repoResponse = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
        headers: getGitHubHeaders()
      });
      
      // 기본 브랜치를 응답에 포함
      res.json({
        default_branch: repoResponse.data.default_branch,
        branches
      });
    } catch (repoErr) {
      console.error('저장소 정보 가져오기 오류:', repoErr.message);
      res.json({ branches });
    }
  } catch (error) {
    console.error('GitHub 브랜치 목록 가져오기 오류:', error.response?.data || error.message);
    
    // 에러 응답 개선
    if (error.response?.status === 404) {
      res.status(404).json({
        error: `저장소를 찾을 수 없습니다: ${req.params.owner}/${req.params.repo}`,
        branches: []
      });
    } else {
      res.status(error.response?.status || 500).json({
        error: `브랜치 목록을 가져오는 중 오류가 발생했습니다: ${error.message}`,
        branches: []
      });
    }
  }
});

// 저장소 콘텐츠 가져오기
router.get('/repos/:owner/:repo/contents/:path(*)?', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { ref } = req.query;
    let path = req.params.path || '';
    
    // 경로 인코딩
    const encodedPath = path ? `/${encodeURIComponent(path).replace(/%2F/g, '/')}` : '';
    
    console.log(`콘텐츠 요청 정보: 소유자=${owner}, 저장소=${repo}, 경로=${path || '루트'}, 브랜치=${ref || '기본'}`);
    
    // GitHub API URL 구성
    const baseUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents${encodedPath}`;
    const requestUrl = ref ? `${baseUrl}?ref=${encodeURIComponent(ref)}` : baseUrl;
    
    console.log(`GitHub API 요청 URL: ${requestUrl}`);
    
    try {
      const response = await axios.get(requestUrl, {
        headers: getGitHubHeaders()
      });
      
      console.log(`GitHub API 응답 상태: ${response.status}`);
      return res.json(response.data);
    } catch (error) {
      console.error('GitHub API 요청 실패:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        url: requestUrl
      });
      
      // 요청 실패 시, 저장소 정보를 가져와 기본 브랜치를 확인
      if (ref) {
        try {
          console.log(`요청 실패, 저장소 기본 정보 확인 중...`);
          const repoInfoResponse = await axios.get(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
            headers: getGitHubHeaders()
          });
          
          const defaultBranch = repoInfoResponse.data.default_branch;
          console.log(`저장소 기본 브랜치: ${defaultBranch}`);
          
          // 요청한 브랜치가 기본 브랜치와 다르면 기본 브랜치로 다시 시도
          if (ref !== defaultBranch) {
            console.log(`기본 브랜치(${defaultBranch})로 재시도 중...`);
            const defaultBranchUrl = `${baseUrl}?ref=${encodeURIComponent(defaultBranch)}`;
            
            try {
              const defaultResponse = await axios.get(defaultBranchUrl, {
                headers: getGitHubHeaders()
              });
              
              console.log(`기본 브랜치로 요청 성공`);
              return res.json(defaultResponse.data);
            } catch (defaultBranchError) {
              console.error(`기본 브랜치(${defaultBranch})로 요청도 실패:`, defaultBranchError.message);
            }
          }
        } catch (repoInfoError) {
          console.error('저장소 정보 확인 실패:', repoInfoError.message);
        }
      }
      
      // 404 오류 응답을 보다 자세하게 제공
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: `경로를 찾을 수 없습니다`,
          details: `저장소 ${owner}/${repo}의 ${path || '루트'} 경로를 ${ref ? `'${ref}' 브랜치에서` : '기본 브랜치에서'} 찾을 수 없습니다.`,
          suggestion: `다른 브랜치를 시도하거나, 경로가 올바른지 확인하세요.`
        });
      }
      
      // 그 외 오류
      return res.status(error.response?.status || 500).json({
        error: `GitHub API 요청 실패: ${error.message}`,
        details: `저장소 ${owner}/${repo}의 ${path || '루트'} 경로를 ${ref ? `'${ref}' 브랜치에서` : '기본 브랜치에서'} 찾을 수 없습니다.`,
        status: error.response?.status
      });
    }
  } catch (error) {
    console.error('GitHub 콘텐츠 요청 처리 중 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 