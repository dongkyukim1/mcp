import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Tabs, Tab, Paper, List, ListItem, ListItemText, ListItemAvatar, 
  Avatar, Divider, Button, CircularProgress, Card, CardContent, CardActions, Chip,
  Grid, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Badge, Link, useTheme, Alert, Select, MenuItem, ListItemIcon,
  Container, CardHeader, Tooltip
} from '@mui/material';
import { 
  GitHub as GitHubIcon, 
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  BugReport as IssueIcon,
  MergeType as PullRequestIcon,
  Bookmark as BookmarkIcon,
  History as HistoryIcon,
  StarBorder as StarIcon,
  AccountTree as BranchIcon,
  Functions as ForkIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ArrowBack as BackIcon,
  Book as BookIcon,
  ListAlt as ListAltIcon,
  Check as CheckIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// API 요청 함수 (명시적 접두사 포함)
const apiRequest = async (method, path, data = null) => {
  const url = `/api${path}`;
  console.log(`GitHub API 요청 생성: ${method.toUpperCase()} ${url}`);
  
  try {
    const config = {
      method,
      url,
      data: method !== 'get' ? data : undefined,
      params: method === 'get' && data ? data : undefined,
      timeout: 10000
    };
    
    const response = await axios(config);
    console.log(`GitHub API 응답 성공: ${method.toUpperCase()} ${url}`, response.status);
    return response;
  } catch (error) {
    console.error(`GitHub API 오류: ${method.toUpperCase()} ${url}`, error.message);
    throw error;
  }
};

const GitHubPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [repos, setRepos] = useState([]);
  const [issues, setIssues] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [commits, setCommits] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoBranches, setRepoBranches] = useState([]);
  const [repoContents, setRepoContents] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [currentBranch, setCurrentBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'repository', 'code'
  const [selectedFile, setSelectedFile] = useState(null);

  // 인증 상태 확인
  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('get', '/github/auth-status');
      setAuthenticated(response.data.isAuthenticated);
      if (response.data.isAuthenticated) {
        setUserData(response.data.user);
      }
    } catch (err) {
      console.error('인증 상태 확인 중 오류:', err);
      
      // API 서버 연결 실패 감지 (ECONNREFUSED, 404, Network Error 등)
      if (err.message && (
        err.message.includes('Network Error') || 
        err.message.includes('ECONNREFUSED') ||
        (err.response && err.response.status === 404)
      )) {
        setError('백엔드 API 서버 연결에 실패했습니다. 서버가 실행 중인지 확인하거나 관리자에게 문의하세요.');
      } else {
        setError('GitHub 연결 상태를 확인하는 중 오류가 발생했습니다.');
      }
      
      // 테스트 모드로 전환
      setTimeout(() => {
        // 테스트 사용자 데이터 설정
        setUserData({
          login: 'test-user',
          name: '테스트 사용자',
          avatar_url: 'https://github.com/github.png',
          html_url: 'https://github.com'
        });
        
        // 테스트 저장소 데이터 설정
        setRepos([
          {
            id: 1,
            name: 'test-repo-1',
            full_name: 'test-user/test-repo-1',
            description: '이 저장소는 테스트 모드에서 표시되는 예시입니다.',
            html_url: 'https://github.com/test-user/test-repo-1',
            default_branch: 'main',
            stargazers_count: 10,
            forks_count: 5,
            open_issues_count: 3,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-08-15T00:00:00Z'
          },
          {
            id: 2,
            name: 'test-repo-2',
            full_name: 'test-user/test-repo-2',
            description: '백엔드 API 서버를 실행하면 실제 GitHub 저장소가 표시됩니다.',
            html_url: 'https://github.com/test-user/test-repo-2',
            default_branch: 'main',
            stargazers_count: 25,
            forks_count: 8,
            open_issues_count: 5,
            created_at: '2023-02-15T00:00:00Z',
            updated_at: '2023-09-01T00:00:00Z'
          }
        ]);
        
        // 테스트 이슈 데이터 설정
        setIssues([
          {
            id: 101,
            number: 1,
            title: '서버 연결 오류 해결하기',
            body: '백엔드 API 서버 연결이 실패하고 있습니다. 서버가 실행 중인지 확인하세요.',
            state: 'open',
            created_at: '2023-08-01T00:00:00Z',
            updated_at: '2023-08-15T00:00:00Z',
            html_url: 'https://github.com/test-user/test-repo-1/issues/1',
            labels: [{ name: 'bug', color: 'ff0000' }],
            user: { login: 'test-user', avatar_url: 'https://github.com/github.png' }
          },
          {
            id: 102,
            number: 2,
            title: '환경 변수 설정 확인하기',
            body: 'GitHub 토큰 환경 변수가 제대로 설정되어 있는지 확인하세요.',
            state: 'open',
            created_at: '2023-08-10T00:00:00Z',
            updated_at: '2023-08-20T00:00:00Z',
            html_url: 'https://github.com/test-user/test-repo-1/issues/2',
            labels: [{ name: 'documentation', color: '0075ca' }],
            user: { login: 'other-user', avatar_url: 'https://github.com/octocat.png' }
          }
        ]);
        
        // 테스트 PR 데이터 설정
        setPullRequests([
          {
            id: 201,
            number: 3,
            title: '테스트 PR: 서버 연결 기능 개선',
            body: '이 PR은 백엔드 API 서버 연결 실패 시 테스트 데이터를 표시하는 기능을 추가합니다.',
            state: 'open',
            created_at: '2023-08-25T00:00:00Z',
            updated_at: '2023-09-01T00:00:00Z',
            html_url: 'https://github.com/test-user/test-repo-1/pull/3',
            user: { login: 'test-user', avatar_url: 'https://github.com/github.png' }
          }
        ]);
        
        // 테스트 커밋 데이터 설정
        setCommits([
          {
            sha: 'abc123def456',
            commit: {
              message: '테스트 모드 기능 추가',
              author: {
                name: '테스트 사용자',
                date: '2023-09-01T00:00:00Z'
              }
            },
            html_url: 'https://github.com/test-user/test-repo-1/commit/abc123def456',
            author: { login: 'test-user', avatar_url: 'https://github.com/github.png' }
          },
          {
            sha: 'xyz789uvw123',
            commit: {
              message: '오류 처리 개선',
              author: {
                name: '테스트 사용자',
                date: '2023-09-02T00:00:00Z'
              }
            },
            html_url: 'https://github.com/test-user/test-repo-1/commit/xyz789uvw123',
            author: { login: 'test-user', avatar_url: 'https://github.com/github.png' }
          }
        ]);
        
        setAuthenticated(true);
        setError('테스트 모드에서 실행 중입니다. 데이터는 실제가 아닙니다. 백엔드 API 서버가 실행 중인지 확인하세요.');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    checkAuth();
  }, []);

  // 인증 후 데이터 로드
  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  // 데이터 가져오기
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reposRes, issuesRes, pullReqRes, commitsRes] = await Promise.all([
        apiRequest('get', '/github/repos'),
        apiRequest('get', '/github/issues'),
        apiRequest('get', '/github/pull-requests'),
        apiRequest('get', '/github/commits')
      ]);
      
      setRepos(reposRes.data);
      setIssues(issuesRes.data);
      setPullRequests(pullReqRes.data);
      setCommits(commitsRes.data);
    } catch (err) {
      console.error('GitHub 데이터 로드 중 오류:', err);
      setError('GitHub 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 저장소 선택 핸들러
  const handleRepoSelect = async (repo) => {
    setViewMode('repository');
    setLoading(true);
    setError(null);
    setSelectedRepo(repo); // 기본 정보로 먼저 설정
    
    try {
      // 저장소 기본 정보 (이미 있는 정보로 설정)
      const initialBranches = [{ name: repo.default_branch || 'main' }];
      setRepoBranches(initialBranches);
      setCurrentBranch(repo.default_branch || 'main');
      setCurrentPath('');
      setRepoContents([]);
      
      // 저장소 상세 정보 가져오기
      try {
        const repoResponse = await apiRequest('get', `/github/repos/${repo.full_name}`);
        setSelectedRepo(repoResponse.data);
        console.log('저장소 상세 정보:', repoResponse.data);
      } catch (repoErr) {
        console.error('저장소 정보 로드 오류:', repoErr);
        // 기본 저장소 정보 유지
      }
      
      // 브랜치 정보 가져오기
      let branchData = [];
      try {
        const branchResponse = await apiRequest('get', `/github/repos/${repo.full_name}/branches`);
        if (branchResponse.data) {
          // 응답 형식 확인 및 처리
          if (branchResponse.data.branches) {
            // 새로운 응답 형식 (branches와 default_branch를 포함)
            branchData = branchResponse.data.branches;
            setRepoBranches(branchData);
            
            // 기본 브랜치가 제공되면 사용하고, 아니면 repo 객체의 기본 브랜치 사용
            const defaultBranch = branchResponse.data.default_branch || repo.default_branch || 'main';
            setCurrentBranch(defaultBranch);
            
            console.log('브랜치 정보:', branchData);
            console.log('기본 브랜치:', defaultBranch);
          } else if (Array.isArray(branchResponse.data)) {
            // 이전 응답 형식 (branches 배열만 있음)
            branchData = branchResponse.data;
            setRepoBranches(branchData);
            setCurrentBranch(repo.default_branch || 'main');
            console.log('브랜치 정보:', branchData);
          } else {
            // 예상치 못한 응답 형식
            console.warn('예상치 못한 브랜치 응답 형식:', branchResponse.data);
            setRepoBranches([{ name: repo.default_branch || 'main' }]);
            setCurrentBranch(repo.default_branch || 'main');
          }
        }
      } catch (branchErr) {
        console.error('브랜치 정보 로드 오류:', branchErr);
        // 기본 브랜치 정보 유지
        setRepoBranches([{ name: repo.default_branch || 'main' }]);
        setCurrentBranch(repo.default_branch || 'main');
      }
      
      // 콘텐츠 정보 가져오기
      try {
        // 먼저 기본 브랜치로 시도
        let contentSuccess = false;
        try {
          const contentResponse = await apiRequest('get', `/github/repos/${repo.full_name}/contents`);
          if (contentResponse.data) {
            setRepoContents(Array.isArray(contentResponse.data) ? contentResponse.data : []);
            console.log('콘텐츠 정보:', contentResponse.data);
            contentSuccess = true;
          }
        } catch (initialErr) {
          console.error('기본 브랜치 콘텐츠 로드 오류:', initialErr);
          // 기본 브랜치 실패 - 다른 브랜치 시도
        }

        // 기본 브랜치 로드 실패 시 다른 브랜치 시도
        if (!contentSuccess) {
          try {
            // 브랜치 정보를 통해 브랜치 목록 얻기
            if (branchData && branchData.length > 0) {
              // 모든 브랜치 목록에서 시도
              for (const branch of branchData) {
                try {
                  console.log(`브랜치 ${branch.name}로 콘텐츠 로드 시도...`);
                  const altResponse = await apiRequest('get', `/github/repos/${repo.full_name}/contents`, { ref: branch.name });
                  
                  if (altResponse.data) {
                    setRepoContents(Array.isArray(altResponse.data) ? altResponse.data : []);
                    console.log(`${branch.name} 브랜치 콘텐츠 정보:`, altResponse.data);
                    setCurrentBranch(branch.name);
                    contentSuccess = true;
                    break;
                  }
                } catch (branchErr) {
                  console.error(`${branch.name} 브랜치 콘텐츠 로드 실패:`, branchErr);
                }
              }
            }
            
            if (!contentSuccess) {
              setError('저장소 콘텐츠를 불러올 수 없습니다. 다른 브랜치를 선택해보세요.');
            }
          } catch (fallbackErr) {
            console.error('다른 브랜치 시도 중 오류:', fallbackErr);
            setError('저장소 콘텐츠를 불러올 수 없습니다. 브랜치를 수동으로 선택해보세요.');
          }
        }
      } catch (contentErr) {
        console.error('콘텐츠 정보 로드 오류:', contentErr);
        setError('저장소 콘텐츠를 불러올 수 없습니다. 저장소가 비어있거나 접근 권한이 없을 수 있습니다.');
      }
    } catch (err) {
      console.error('저장소 상세 정보 로드 중 오류:', err);
      setError('저장소 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 폴더 선택 핸들러
  const handleFolderClick = async (folder) => {
    setLoading(true);
    setError(null);
    
    try {
      // 경로 업데이트
      const newPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
      console.log(`폴더 ${newPath} 내용 로드 시도...`);
      
      try {
        // 콘텐츠 요청 (브랜치 포함)
        const response = await apiRequest('get', `/github/repos/${selectedRepo.full_name}/contents/${newPath}`, { ref: currentBranch });
        
        if (response.data) {
          setRepoContents(Array.isArray(response.data) ? response.data : []);
          setCurrentPath(newPath);
          console.log(`새 경로 ${newPath} 콘텐츠:`, response.data);
        }
      } catch (err) {
        console.error('폴더 내용 로드 오류:', err);
        
        // 404 오류 처리 - 브랜치에 해당 폴더가 없는 경우
        if (err.response?.status === 404) {
          setError(`"${currentBranch}" 브랜치에 "${folder.name}" 폴더가 존재하지 않습니다. 다른 브랜치를 선택해 보세요.`);
          
          // 브랜치 목록 다시 가져오기 (다른 선택지 제공)
          try {
            const branchResponse = await apiRequest('get', `/github/repos/${selectedRepo.full_name}/branches`);
            if (branchResponse.data && branchResponse.data.length > 0) {
              setRepoBranches(branchResponse.data);
            }
          } catch (branchErr) {
            console.error('브랜치 정보 재로드 오류:', branchErr);
          }
        } else {
          setError(`폴더 내용을 불러올 수 없습니다: ${err.response?.data?.error || err.message}`);
        }
      }
    } catch (err) {
      console.error('폴더 내용 로드 처리 중 오류:', err);
      setError(`폴더 내용을 불러올 수 없습니다: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 상위 폴더로 이동
  const handleBackClick = async () => {
    if (!currentPath) return; // 이미 루트에 있음
    
    setLoading(true);
    setError(null);
    
    try {
      // 상위 경로 계산
      const parts = currentPath.split('/');
      const newPath = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      console.log(`상위 경로 ${newPath || '(루트)'} 로드 시도...`);
      
      // 콘텐츠 요청 (브랜치 포함)
      const response = await apiRequest(
        'get',
        newPath 
          ? `/github/repos/${selectedRepo.full_name}/contents/${newPath}`
          : `/github/repos/${selectedRepo.full_name}/contents`,
        { ref: currentBranch }
      );
      
      if (response.data) {
        setRepoContents(Array.isArray(response.data) ? response.data : []);
        setCurrentPath(newPath);
        console.log(`상위 경로 ${newPath || '(루트)'} 콘텐츠:`, response.data);
      }
    } catch (err) {
      console.error('상위 폴더 내용 로드 오류:', err);
      setError(`폴더 내용을 불러올 수 없습니다: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 검색 핸들러
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // 뒤로 가기 핸들러
  const handleBack = () => {
    if (viewMode === 'repository') {
      setViewMode('overview');
      setSelectedRepo(null);
    } else if (viewMode === 'code') {
      setViewMode('repository');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  };

  // 브랜치 변경 핸들러
  const handleBranchChange = async (event) => {
    const branchName = event.target.value;
    setLoading(true);
    setError(null);
    setCurrentBranch(branchName);
    
    // 경로 초기화 - 브랜치를 변경할 때 루트 디렉토리부터 시작
    setCurrentPath('');
    
    try {
      console.log(`브랜치 변경: ${branchName}, 루트 콘텐츠 로드 중...`);
      
      // 루트 경로의 콘텐츠 로드
      const response = await apiRequest('get', `/github/repos/${selectedRepo.full_name}/contents`, { ref: branchName });
      
      if (response.data) {
        setRepoContents(Array.isArray(response.data) ? response.data : []);
        console.log(`브랜치 ${branchName}의 콘텐츠:`, response.data);
      }
    } catch (err) {
      console.error(`브랜치 ${branchName} 콘텐츠 로드 오류:`, err);
      
      if (err.response?.status === 404) {
        setError(`브랜치 "${branchName}"에 접근할 수 없습니다. 저장소가 비어있거나 브랜치 이름이 올바르지 않을 수 있습니다.`);
        
        // 브랜치 목록 다시 가져오기
        try {
          const branchResponse = await apiRequest('get', `/github/repos/${selectedRepo.full_name}/branches`);
          if (branchResponse.data && branchResponse.data.length > 0) {
            setRepoBranches(branchResponse.data);
            
            // 기본 브랜치로 돌아가기
            const defaultBranch = branchResponse.data.find(b => 
              b.name === selectedRepo.default_branch
            )?.name || branchResponse.data[0].name;
            
            setCurrentBranch(defaultBranch);
            
            // 기본 브랜치의 콘텐츠 로드
            try {
              const defaultResponse = await apiRequest('get', `/github/repos/${selectedRepo.full_name}/contents`, { ref: defaultBranch });
              
              if (defaultResponse.data) {
                setRepoContents(Array.isArray(defaultResponse.data) ? defaultResponse.data : []);
                console.log(`기본 브랜치 ${defaultBranch}의 콘텐츠:`, defaultResponse.data);
              }
            } catch (defaultErr) {
              console.error(`기본 브랜치 콘텐츠 로드 오류:`, defaultErr);
              setRepoContents([]);
            }
          }
        } catch (branchErr) {
          console.error('브랜치 정보 재로드 오류:', branchErr);
        }
      } else {
        setError(`브랜치 ${branchName}의 콘텐츠를 불러올 수 없습니다: ${err.response?.data?.error || err.message}`);
        setRepoContents([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // HTML 문자열 이스케이프
  const escapeHtml = (html) => {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // 파일 선택 핸들러
  const handleFileClick = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`파일 ${file.path} 내용 로드 시도...`);
      
      // 파일 확장자 확인
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isImageFile = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(fileExtension);
      const isHtmlFile = ['html', 'htm'].includes(fileExtension);
      
      // 파일 콘텐츠 요청
      const response = await apiRequest('get', `/github/repos/${selectedRepo.full_name}/contents/${file.path}`, { ref: currentBranch });
      
      if (response.data) {
        if (isImageFile) {
          // 이미지 파일은 콘텐츠 디코딩 없이 download_url 사용
          setSelectedFile({
            ...file,
            isImage: true,
            isHtml: false,
            download_url: response.data.download_url,
            html_url: response.data.html_url
          });
        } else if (response.data.content) {
          // 텍스트 파일은 Base64 디코딩
          const content = atob(response.data.content.replace(/\n/g, ''));
          
          // 한글 인코딩 문제 처리 - UTF-8 텍스트를 올바르게 표시
          let decodedContent = content;
          
          // UTF-8 문자열인지 확인 (한글 포함 여부)
          const hasUnicodeCharacters = /[^\u0000-\u007f]/.test(content);
          
          if (hasUnicodeCharacters) {
            try {
              // 이미 UTF-8로 올바르게 디코딩된 경우
              console.log('유니코드 문자가 포함된 파일입니다.');
            } catch (encError) {
              console.error('인코딩 처리 중 오류:', encError);
            }
          }
          
          console.log(`파일 콘텐츠 로드 성공`);
          
          setSelectedFile({
            ...file,
            isImage: false,
            isHtml: isHtmlFile,
            content: isHtmlFile ? escapeHtml(decodedContent) : decodedContent,
            rawContent: response.data.content,
            encoding: response.data.encoding,
            fileExtension,
            html_url: response.data.html_url
          });
        } else {
          setError('파일 내용을 불러올 수 없습니다.');
        }
        
        // 보기 모드를 파일로 변경
        setViewMode('file');
      }
    } catch (err) {
      console.error('파일 내용 로드 오류:', err);
      setError(`파일 내용을 불러올 수 없습니다: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 파일 뷰 (viewMode === 'file')
  if (viewMode === 'file' && selectedFile) {
    // 인코딩 정보 표시를 위한 변수
    const encodingLabel = selectedFile.isHtml ? 'HTML' : 
                         (selectedFile.fileExtension === 'js' ? 'JavaScript' : 
                         (selectedFile.fileExtension === 'css' ? 'CSS' : 
                         (selectedFile.fileExtension === 'json' ? 'JSON' : 
                         selectedFile.fileExtension?.toUpperCase() || '텍스트')));

    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => setViewMode('repository')} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            {selectedFile.name}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              경로: {selectedFile.path}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              크기: {selectedFile.size} 바이트
            </Typography>
            <Typography variant="body2" color="textSecondary">
              파일 형식: {encodingLabel}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              인코딩: {selectedFile.encoding || 'UTF-8'}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {selectedFile.isImage ? (
            // 이미지 파일 표시
            <Box sx={{ 
              textAlign: 'center', 
              my: 2,
              maxHeight: '70vh',
              overflow: 'auto'
            }}>
              <img 
                src={selectedFile.download_url} 
                alt={selectedFile.name} 
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          ) : selectedFile.isHtml ? (
            // HTML 파일 표시 (이스케이프된 HTML)
            <Box sx={{ 
              bgcolor: '#282c34', 
              color: '#abb2bf',
              p: 2, 
              borderRadius: 1, 
              maxHeight: '70vh', 
              overflow: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              fontSize: '0.9rem',
              '& .html-tag': {
                color: '#e06c75'
              },
              '& .html-attr': {
                color: '#d19a66'
              },
              '& .html-value': {
                color: '#98c379'
              },
              '& .html-comment': {
                color: '#5c6370',
                fontStyle: 'italic'
              }
            }}>
              <div dangerouslySetInnerHTML={{ 
                __html: selectedFile.content
                  .replace(/&lt;([\/\w]+)(?=[\s>])/g, '<span class="html-tag">&lt;$1</span>')
                  .replace(/([a-zA-Z-]+)=(&quot;|&#039;)/g, '<span class="html-attr">$1</span>=$2')
                  .replace(/(&quot;|&#039;)(.*?)(&quot;|&#039;)/g, '$1<span class="html-value">$2</span>$3')
                  .replace(/&lt;!--(.*?)--&gt;/gs, '<span class="html-comment">&lt;!--$1--&gt;</span>')
              }} />
            </Box>
          ) : (
            // 일반 코드 파일 표시
            <Box sx={{ 
              bgcolor: '#282c34', 
              color: '#abb2bf',
              p: 2, 
              borderRadius: 1, 
              maxHeight: '70vh', 
              overflow: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              fontSize: '0.9rem'
            }}>
              {selectedFile.content}
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="textSecondary">
              * UTF-8 인코딩으로 표시됩니다. 한글이 깨져 보인다면 다운로드 후 확인하세요.
            </Typography>
            
            <Button 
              variant="outlined" 
              href={selectedFile.html_url || `https://github.com/${selectedRepo.full_name}/blob/${currentBranch}/${selectedFile.path}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              GitHub에서 보기
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // 로딩 화면
  if (loading && !userData && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // 인증되지 않은 상태
  if (!authenticated) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          GitHub 연결
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" p={3}>
            <GitHubIcon sx={{ fontSize: 60, color: 'text.primary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              GitHub에 연결되지 않았습니다
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              GitHub에 연결하려면 환경 변수에 GITHUB_TOKEN을 설정하세요.
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  // 레포지토리 상세 보기
  if (viewMode === 'repository' && selectedRepo) {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {selectedRepo.name}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRepo.full_name}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRepo.description || '설명 없음'}
              </Typography>
              <Box display="flex" gap={2} mb={2}>
                <Chip icon={<StarIcon />} label={`${selectedRepo.stargazers_count} 스타`} />
                <Chip icon={<ForkIcon />} label={`${selectedRepo.forks_count} 포크`} />
                <Chip icon={<IssueIcon />} label={`${selectedRepo.open_issues_count} 이슈`} />
                <Chip icon={<BranchIcon />} label={`${repoBranches.length} 브랜치`} />
              </Box>
            </Box>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                onClick={() => handleRepoSelect(selectedRepo)}
                sx={{ mb: 1 }}
              >
                새로고침
              </Button>
            </Box>
          </Box>
        </Paper>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="파일" icon={<FolderIcon />} />
          <Tab label="이슈" icon={<IssueIcon />} />
          <Tab label="PR" icon={<PullRequestIcon />} />
          <Tab label="커밋" icon={<HistoryIcon />} />
        </Tabs>

        {tabValue === 0 && (
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center">
                <Typography variant="body1" mr={2}>
                  브랜치:
                </Typography>
                <Select
                  value={currentBranch}
                  onChange={handleBranchChange}
                  size="small"
                >
                  {repoBranches.map(branch => (
                    <MenuItem key={branch.name} value={branch.name}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                {currentPath && (
                  <Button 
                    startIcon={<BackIcon />} 
                    onClick={handleBackClick}
                    size="small"
                  >
                    상위 폴더
                  </Button>
                )}
              </Box>
            </Box>

            <Typography variant="body2" color="textSecondary" mb={1}>
              현재 경로: /{currentPath}
            </Typography>
            
            <List>
              {Array.isArray(repoContents) && repoContents.map((item) => (
                <React.Fragment key={item.sha}>
                  {item.type === 'file' ? (
                    <ListItem 
                      button 
                      onClick={() => handleFileClick(item)}
                    >
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText primary={item.name} />
                    </ListItem>
                  ) : (
                    <ListItem 
                      button 
                      onClick={() => handleFolderClick(item)}
                      disabled={item.type !== 'dir'}
                    >
                      <ListItemIcon>
                        <FolderIcon />
                      </ListItemIcon>
                      <ListItemText primary={item.name} />
                    </ListItem>
                  )}
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom>이슈</Typography>
              <Button 
                variant="outlined" 
                startIcon={<IssueIcon />}
                href={`https://github.com/${selectedRepo.full_name}/issues`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub에서 이슈 보기
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* 이슈가 없는 경우 */}
                {issues.filter(issue => issue.repo === selectedRepo.full_name || 
                             issue.repo?.startsWith(`${selectedRepo.full_name}/`)).length === 0 ? (
                  <Box textAlign="center" p={3}>
                    <Typography variant="body1" color="textSecondary">
                      이 저장소에 이슈가 없습니다.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<IssueIcon />}
                      href={`https://github.com/${selectedRepo.full_name}/issues/new`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ mt: 2 }}
                    >
                      새 이슈 만들기
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {issues
                      .filter(issue => 
                        issue.repo === selectedRepo.full_name || 
                        issue.repo?.startsWith(`${selectedRepo.full_name}/`)
                      )
                      .map((issue) => (
                        <React.Fragment key={issue.id}>
                          <ListItem 
                            button 
                            component="a" 
                            href={issue.html_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: issue.state === 'open' ? 'error.light' : 'success.light' }}>
                                <IssueIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" flexWrap="wrap">
                                  <Typography variant="subtitle1" component="span" fontWeight="bold">
                                    {issue.title}
                                  </Typography>
                                  <Chip 
                                    label={issue.state} 
                                    color={issue.state === 'open' ? 'error' : 'success'}
                                    size="small"
                                    sx={{ ml: 1 }}
                                  />
                                  {issue.labels?.map(label => (
                                    <Chip 
                                      key={label.id || Math.random()} 
                                      label={label.name}
                                      size="small"
                                      sx={{ 
                                        ml: 1,
                                        bgcolor: label.color ? `#${label.color}22` : 'default',
                                        color: label.color ? `#${label.color}` : 'default'
                                      }}
                                    />
                                  ))}
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" component="span">
                                    #{issue.number} 
                                  </Typography>
                                  <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                    {issue.user?.login} 님이 {formatDate(issue.created_at)}에 작성
                                  </Typography>
                                  {issue.comments > 0 && (
                                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                      • 댓글 {issue.comments}개
                                    </Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                  </List>
                )}
              </>
            )}
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>풀 리퀘스트</Typography>
            {/* PR 목록 구현은 여기에 추가 */}
          </Paper>
        )}

        {tabValue === 3 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>커밋 기록</Typography>
            {/* 커밋 목록 구현은 여기에 추가 */}
          </Paper>
        )}
      </Box>
    );
  }

  // 기본 화면 (레포지토리 목록)
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Card elevation={2}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center">
                <GitHubIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h4" component="h1">GitHub</Typography>
              </Box>
            }
            subheader={
              userData && (
                <Box display="flex" alignItems="center" mt={1}>
                  <Avatar src={userData.avatar_url} alt={userData.name || userData.login} sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h6">{userData.name || userData.login}</Typography>
                    <Typography variant="body2" color="text.secondary">@{userData.login}</Typography>
                  </Box>
                </Box>
              )
            }
            action={
              <Box>
                {authenticated ? (
                  <>
                    <Tooltip title="새로고침">
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        sx={{ mr: 1 }}
                        disabled={loading}
                      >
                        새로고침
                      </Button>
                    </Tooltip>
                    <TextField
                      placeholder="저장소 검색..."
                      size="small"
                      value={searchQuery}
                      onChange={handleSearch}
                      sx={{ mr: 1, minWidth: 200 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                ) : (
                  <Tooltip title="GitHub 계정 연결하기">
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<LinkIcon />}
                      onClick={() => {
                        // Implement the logic to connect to GitHub
                      }}
                    >
                      GitHub 연결하기
                    </Button>
                  </Tooltip>
                )}
              </Box>
            }
          />

          {error && (
            <Box px={2}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            </Box>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2 }}
            >
              <Tab 
                icon={<BookIcon />} 
                iconPosition="start" 
                label="저장소" 
                id="tab-0" 
                aria-controls="tabpanel-0" 
              />
              <Tab 
                icon={<IssueIcon />} 
                iconPosition="start" 
                label="이슈" 
                id="tab-1" 
                aria-controls="tabpanel-1" 
              />
              <Tab 
                icon={<PullRequestIcon />} 
                iconPosition="start" 
                label="Pull Requests" 
                id="tab-2" 
                aria-controls="tabpanel-2" 
              />
              <Tab 
                icon={<HistoryIcon />} 
                iconPosition="start" 
                label="커밋" 
                id="tab-3" 
                aria-controls="tabpanel-3" 
              />
            </Tabs>
          </Box>

          <CardContent>
            {/* 저장소 탭 */}
            <div
              role="tabpanel"
              hidden={tabValue !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  {repos
                    .filter(repo => repo.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((repo) => (
                      <Grid item xs={12} md={6} lg={4} key={repo.id}>
                        <Card 
                          variant="outlined" 
                          sx={{
                            height: '100%',
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <CardHeader 
                            title={
                              <Typography variant="h6" noWrap sx={{ cursor: 'pointer' }} onClick={() => handleRepoSelect(repo)}>
                                {repo.name}
                              </Typography>
                            }
                            subheader={
                              <Box display="flex" alignItems="center" mt={1}>
                                <Chip 
                                  icon={<StarIcon fontSize="small" />} 
                                  label={repo.stargazers_count}
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  icon={<ForkIcon fontSize="small" />} 
                                  label={repo.forks_count}
                                  size="small"
                                />
                              </Box>
                            }
                          />
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" sx={{ minHeight: '60px' }}>
                              {repo.description || '설명 없음'}
                            </Typography>
                            <Box display="flex" alignItems="center" mt={2} fontSize="small" color="text.secondary">
                              <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="caption">
                                 {formatDate(repo.updated_at)}
                              </Typography>
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              startIcon={<CodeIcon />}
                              onClick={() => handleRepoSelect(repo)}
                            >
                              코드 보기
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              )}
            </div>

            {/* 이슈 탭 */}
            <div
              role="tabpanel"
              hidden={tabValue !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {tabValue === 1 && (
                <List>
                  {issues.length > 0 ? issues.map(issue => (
                    <Card key={issue.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardHeader
                        avatar={
                          <Avatar src={issue.user?.avatar_url} alt={issue.user?.login} />
                        }
                        title={
                          <Box display="flex" alignItems="center">
                            <IssueIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              {issue.title}
                            </Typography>
                          </Box>
                        }
                        subheader={
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary">
                              #{issue.number} opened by {issue.user?.login}
                            </Typography>
                            <Box display="flex" mt={1}>
                              {issue.labels && issue.labels.map(label => (
                                <Chip 
                                  key={label.name}
                                  label={label.name}
                                  size="small"
                                  sx={{ 
                                    mr: 1, 
                                    backgroundColor: `#${label.color}`,
                                    color: theme.palette.getContrastText(`#${label.color}`)
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2">
                          {issue.body?.substring(0, 200)}{issue.body?.length > 200 ? '...' : ''}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          component="a" 
                          href={issue.html_url} 
                          target="_blank"
                          startIcon={<BookmarkIcon />}
                        >
                          GitHub에서 보기
                        </Button>
                      </CardActions>
                    </Card>
                  )) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                      <IssueIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        이슈가 없습니다.
                      </Typography>
                    </Paper>
                  )}
                </List>
              )}
            </div>

            {/* 나머지 탭도 유사하게 수정 */}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default GitHubPage;
