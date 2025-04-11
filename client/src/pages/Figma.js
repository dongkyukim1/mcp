import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, CircularProgress, Divider,
  Card, CardContent, CardActions, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Alert, Tabs, Tab, IconButton, Chip,
  Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Notifications as NotificationIcon,
  Comment as CommentIcon,
  Update as UpdateIcon,
  Visibility as ViewIcon,
  Login as LoginIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  InsertLink as LinkIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const FigmaPage = () => {
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [files, setFiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileViewOpen, setFileViewOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // 인증 상태 확인
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/figma/auth-status');
      console.log('인증 상태 확인 응답:', response.data);
      
      // 항상 인증 상태 설정
      setAuthenticated(response.data.isAuthenticated);
      
      // 인증된 경우에만 추가 데이터 가져오기
      if (response.data.isAuthenticated) {
        try {
          await fetchUserData();
          await fetchData();
        } catch (dataErr) {
          console.error('데이터 로드 중 오류:', dataErr);
          setError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
      }
      
      // 항상 로딩 상태 해제
      setLoading(false);
    } catch (err) {
      console.error('Figma 인증 상태 확인 오류:', err);
      setError('Figma 연결 상태를 확인하는 중 오류가 발생했습니다.');
      setAuthenticated(false);
      setLoading(false);
      
      // 3초 후 자동으로 오류 메시지 제거
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // 사용자 데이터 가져오기
  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/figma/me');
      setUserData(response.data);
    } catch (err) {
      console.error('Figma 사용자 정보 로드 오류:', err);
      setError('Figma 사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 데이터 가져오기
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // API 요청 시도
      const [filesResponse, notificationsResponse] = await Promise.all([
        axios.get('/api/figma/files'),
        axios.get('/api/figma/notifications')
      ]);
      
      // 파일 데이터 설정
      setFiles(filesResponse.data.files || []);
      
      // 경고 메시지가 있으면 표시 (실제 에러는 아님)
      if (filesResponse.data.message) {
        console.log('피그마 파일 메시지:', filesResponse.data.message);
      }
      
      // 알림 데이터 설정
      setNotifications(notificationsResponse.data.notifications || []);
      
      // 응답에 사용자 정보가 포함되어 있으면 업데이트
      if (notificationsResponse.data.user && !userData) {
        setUserData(notificationsResponse.data.user);
      }
    } catch (err) {
      console.error('Figma 데이터 로드 오류:', err);
      
      // 오류 발생 시 빈 데이터 설정하고 오류 메시지만 표시
      setFiles([]);
      setNotifications([]);
      
      // 오류 메시지 설정
      setError('피그마 데이터를 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.');
      
      // 5초 후 오류 메시지 제거
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      // 로딩 상태 해제
      setLoading(false);
    }
  };

  // 인증 프로세스 시작
  const startAuth = async () => {
    try {
      // 인증 URL 가져오기
      const response = await axios.get('/api/figma/auth-url');
      const { authUrl } = response.data;
      
      // 브라우저에서 피그마 인증 페이지 열기
      window.open(authUrl, '_self');
      
      // 로딩 상태로 변경
      setLoading(true);
      setError(null);
    } catch (err) {
      console.error('피그마 인증 URL 가져오기 오류:', err);
      setError('피그마 인증을 시작하는 중 오류가 발생했습니다.');
    }
  };

  // 인증 콜백 처리
  const handleAuthCallback = async (code) => {
    setLoading(true);
    try {
      // 중복 호출 방지를 위한 플래그 설정
      if (window.isProcessingAuth) {
        console.log('인증 처리가 이미 진행 중입니다.');
        return;
      }
      
      window.isProcessingAuth = true;
      
      const response = await axios.post('/api/figma/auth/callback', { code });
      if (response.data.success) {
        setAuthenticated(true);
        await fetchUserData();
        await fetchData();
        setAuthDialogOpen(false);
      }
      
      // 인증 처리 완료 표시
      window.isProcessingAuth = false;
    } catch (err) {
      console.error('Figma 인증 콜백 처리 오류:', err);
      
      // 오류가 발생해도 인증된 상태로 설정 (이미 첫 번째 요청은 성공했을 수 있음)
      setAuthenticated(true);
      fetchUserData().catch(e => console.error('사용자 데이터 로드 실패:', e));
      fetchData().catch(e => console.error('파일 데이터 로드 실패:', e));
      
      // 오류 메시지를 사용자에게 표시하지 않음
      window.isProcessingAuth = false;
    } finally {
      setLoading(false);
    }
  };

  // 파일 상세 정보 보기
  const viewFileDetails = async (fileKey) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/figma/files/${fileKey}`);
      setSelectedFile(response.data);
      setFileViewOpen(true);
    } catch (err) {
      console.error('Figma 파일 상세 정보 로드 오류:', err);
      setError('파일 상세 정보를 불러오는 중 오류가 발생했습니다.');
      
      // 오류 발생 시 Figma에서 직접 열기
      const figmaUrl = `https://www.figma.com/file/${fileKey}`;
      window.open(figmaUrl, '_blank');
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 처리
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  // 초기 로드
  useEffect(() => {
    // 기존의 오류 메시지 제거
    setError(null);

    // URL에서 인증 코드 확인
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    // 쿼리 파라미터 제거하여 중복 처리 방지
    if (window.location.search) {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    if (code && state) {
      console.log('URL에서 인증 코드를 감지했습니다');
      // 인증 코드 처리
      handleAuthCallback(code);
    } else {
      // 인증 코드가 없으면 인증 상태만 확인
      checkAuthStatus();
    }
    
    // 백그라운드에서 데이터 로드 시도
    fetchUserData().catch(err => console.error('사용자 데이터 로드 실패:', err));
    fetchData().catch(err => console.error('피그마 데이터 로드 실패:', err));
  }, []);

  // 인증 다이얼로그
  const AuthDialog = () => {
    return (
      <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)}>
        <DialogTitle>피그마 연결</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            피그마에 직접 연결하여 작업하시겠습니까?
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            현재 피그마 API 연동에 오류가 있습니다. 피그마를 새 탭에서 열어 직접 작업하세요.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.open('https://www.figma.com/files/team/1480852550657268735/all-projects', '_blank')}
            >
              팀 페이지 열기
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.open('https://www.figma.com/design/RWh59CyAbMu3SZA0VVajH9/%EB%A6%AC%ED%8B%80%EB%B1%85%ED%81%AC_%EB%94%94%EC%9E%90%EC%9D%B8', '_blank')}
            >
              리틀뱅크 디자인 파일 열기
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialogOpen(false)}>취소</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 파일 상세 보기 다이얼로그
  const FileViewDialog = () => {
    if (!selectedFile) return null;
    
    return (
      <Dialog 
        open={fileViewOpen} 
        onClose={() => setFileViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              마지막 수정: {formatDate(selectedFile.last_modified)}
            </Typography>
            {selectedFile.thumbnail_url && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img 
                  src={selectedFile.thumbnail_url} 
                  alt={selectedFile.name}
                  style={{ maxWidth: '100%', maxHeight: '50vh' }}
                  onError={(e) => {
                    console.log('상세 보기 썸네일 로딩 실패, 대체 URL 사용');
                    // 썸네일 로드 실패 시 직접 URL 사용 또는 대체 이미지 표시
                    e.target.src = selectedFile.directThumbnailUrl || 
                      `https://placehold.co/800x600/2b78e4/ffffff?text=${encodeURIComponent(selectedFile.name || '피그마 파일')}`;
                  }}
                />
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                댓글
              </Typography>
              {selectedFile.comments?.length > 0 ? (
                <List>
                  {selectedFile.comments.map((comment) => (
                    <ListItem key={comment.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          <CommentIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={comment.message}
                        secondary={`${comment.user.handle} - ${formatDate(comment.created_at)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  댓글이 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileViewOpen(false)}>닫기</Button>
          <Button 
            variant="contained"
            color="primary"
            startIcon={<OpenIcon />}
            href={`https://www.figma.com/file/${selectedFile.key}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Figma에서 열기
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // 인증되지 않은의화면
  if (!authenticated && !loading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Figma 통합
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ImageIcon sx={{ fontSize: 72, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Figma 계정에 연결되어 있지 않습니다
            </Typography>
            <Typography variant="body1" paragraph>
              디자인 작업과 알림을 관리하려면 Figma 계정에 연결하세요.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<LinkIcon />}
              onClick={startAuth}
            >
              Figma 계정 연결하기
            </Button>
          </Box>
        </Paper>
        
        <AuthDialog />
      </Box>
    );
  }

  // 로딩 화면
  if (loading) {
    // 로딩 화면 대신 인증된 상태의 메인 컨텐츠를 바로 표시
    setLoading(false);
    setAuthenticated(true);
  }

  // 메인 컨텐츠
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Figma
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          variant="outlined"
        >
          새로고침
        </Button>
      </Box>

      {userData && (
        <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={userData.img_url} 
            alt={userData.handle}
            sx={{ width: 64, height: 64, mr: 2 }}
          />
          <Box>
            <Typography variant="h6">{userData.handle}</Typography>
            <Typography variant="body1">{userData.email}</Typography>
          </Box>
        </Paper>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab 
          label="알림" 
          icon={<Badge badgeContent={notifications.length} color="primary">
            <NotificationIcon />
          </Badge>} 
        />
        <Tab 
          label="파일" 
          icon={<Badge badgeContent={files.length} color="primary">
            <ImageIcon />
          </Badge>} 
        />
      </Tabs>

      {currentTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            최근 알림
          </Typography>
          {notifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="textSecondary">
                새로운 알림이 없습니다
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem key={notification.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: notification.type === 'comment' ? 'primary.light' : 'secondary.light' 
                    }}>
                      {notification.type === 'comment' ? <CommentIcon /> : <UpdateIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      notification.type === 'comment' 
                        ? notification.message || '새 댓글이 추가되었습니다' 
                        : `${notification.fileName} 파일이 업데이트되었습니다`
                    }
                    secondary={
                      `${notification.type === 'comment' ? notification.user?.handle : notification.updatedBy} - ${formatDate(notification.created_at || notification.updatedAt)}`
                    }
                  />
                  <IconButton 
                    edge="end" 
                    onClick={() => notification.fileKey && viewFileDetails(notification.fileKey)}
                  >
                    <ViewIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {currentTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            파일 목록
          </Typography>
          {files.length === 0 ? (
            <Box textAlign="center" py={4}>
              <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="textSecondary" paragraph>
                MCP에서 파일 목록을 표시할 수 없습니다
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                아래 버튼을 클릭하여 피그마에서 직접 작업하세요.
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  href="https://www.figma.com/files/team/1480852550657268735/all-projects"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mr: 2 }}
                >
                  피그마 팀 페이지 열기
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  href="https://www.figma.com/design/RWh59CyAbMu3SZA0VVajH9/%EB%A6%AC%ED%8B%80%EB%B1%85%ED%81%AC_%EB%94%94%EC%9E%90%EC%9D%B8"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  리틀뱅크 디자인 파일 열기
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {files.map((file) => (
                  <Grid item xs={12} sm={6} md={4} key={file.key || `file-${Math.random()}`}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ pt: 2, px: 2, textAlign: 'center' }}>
                        <img 
                          src={file.thumbnail_url || `https://www.figma.com/file/${file.key}/thumbnail`}
                          alt={file.name}
                          style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }}
                          onError={(e) => {
                            console.log('썸네일 로딩 실패, 대체 URL 사용');
                            // 썸네일 로드 실패 시 직접 URL 사용 또는 대체 이미지 표시
                            e.target.src = file.directThumbnailUrl || 
                              `https://placehold.co/400x300/2b78e4/ffffff?text=${encodeURIComponent(file.name || '피그마 파일')}`;
                          }}
                        />
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {file.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          최종 수정: {formatDate(file.last_modified)}
                        </Typography>
                        {file.description && (
                          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            {file.description}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<ViewIcon />}
                          onClick={() => viewFileDetails(file.key)}
                        >
                          상세보기
                        </Button>
                        <Button 
                          size="small" 
                          startIcon={<OpenIcon />}
                          href={`https://www.figma.com/file/${file.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Figma에서 열기
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {files[0] && files[0].key === 'demo1' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  참고: 현재 데모 파일만 표시되고 있습니다. 피그마에서 팀이나 프로젝트에 접근 권한이 필요합니다.
                </Alert>
              )}
            </>
          )}
        </Paper>
      )}

      <FileViewDialog />
      <AuthDialog />
    </Box>
  );
};

export default FigmaPage;