import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  CircularProgress, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  useTheme,
  alpha,
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Description as DocumentIcon,
  ArrowUpward as PriorityHighIcon,
  ArrowForward as PriorityMediumIcon,
  ArrowDownward as PriorityLowIcon,
  Pending as PendingIcon,
  PlayArrow as InProgressIcon,
  NotesRounded as NotesIcon,
  Timelapse as TimeIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 로깅 Axios 인터셉터 설정
axios.interceptors.request.use(request => {
  console.log('Axios 요청:', request.method, request.url);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Axios 응답:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('Axios 오류:', error.message, error.config?.url);
    if (error.response) {
      console.error('오류 상태:', error.response.status);
      console.error('오류 데이터:', error.response.data);
    }
    return Promise.reject(error);
  }
);

const NotionPage = () => {
  const theme = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '중간',
    status: '진행 전'
  });
  const [connected, setConnected] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [backendCheck, setBackendCheck] = useState({ checking: true, available: false });

  // 백엔드 서버 연결 확인
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // 간단한 핑 요청으로 서버 활성 상태 확인
        const statusResponse = await axios.get('/notion/auth-status', { timeout: 3000 });
        setBackendCheck({ checking: false, available: true });
        console.log('백엔드 서버 연결 확인 완료: 서버 활성화됨');
      } catch (err) {
        console.error('백엔드 서버 연결 확인 실패:', err.message);
        setBackendCheck({ checking: false, available: false });
        setSnackbarMessage('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    };
    
    checkBackend();
  }, []);

  // 노션 인증 및 작업 목록 가져오기
  useEffect(() => {
    const checkConnection = async () => {
      if (backendCheck.checking) return; // 백엔드 확인이 진행 중이면 대기
      
      try {
        console.log('노션 인증 상태 확인 시도...');
        const authResponse = await axios.get('/notion/auth-status');
        console.log('노션 인증 상태 응답:', authResponse.data);
        
        // API 키가 설정되어 있으면 항상 연결된 것으로 처리
        if (authResponse.data.apiKeySet) {
          console.log('API 키 설정됨, 인증됨으로 처리');
          setConnected(true);
          setError(null);
          fetchTasks();
        } else if (authResponse.data.isAuthenticated) {
          console.log('OAuth 인증됨');
          setConnected(true);
          setError(null);
          fetchTasks();
        } else {
          setLoading(false);
          setError('노션 계정에 연결되어 있지 않습니다. 노션 연결 설정을 확인해주세요.');
        }
      } catch (err) {
        console.error('노션 연결 확인 오류:', err);
        setLoading(false);
        
        // API 서버 연결 실패 감지 (ECONNREFUSED, 404, Network Error 등)
        if (err.message && (
          err.message.includes('Network Error') || 
          err.message.includes('ECONNREFUSED') ||
          (err.response && err.response.status === 404)
        )) {
          setError('백엔드 API 서버 연결에 실패했습니다. 서버가 실행 중인지 확인하거나 관리자에게 문의하세요.');
        } else {
          setError('노션 연결 상태를 확인하는 중 오류가 발생했습니다.');
        }
        
        // 로컬 테스트 모드로 전환
        setTimeout(() => {
          // 테스트 데이터 설정
          setTasks([
            {
              id: 'test-1',
              title: '테스트 작업 1',
              description: '이 작업은 API 서버 없이 테스트 모드에서 표시되는 예시입니다.',
              priority: '높음',
              status: '진행 중'
            },
            {
              id: 'test-2',
              title: '테스트 작업 2',
              description: '백엔드 API 서버를 실행하면 실제 노션 작업이 표시됩니다.',
              priority: '중간',
              status: '진행 전'
            },
            {
              id: 'test-3',
              title: '서버 실행 확인하기',
              description: '서버가 실행 중인지 확인하고 필요한 환경 변수가 설정되었는지 확인하세요.',
              priority: '높음',
              status: '완료'
            }
          ]);
          setConnected(true);
          setSnackbarMessage('테스트 모드에서 실행 중입니다. 데이터는 실제가 아닙니다.');
          setSnackbarSeverity('warning');
          setOpenSnackbar(true);
        }, 1000);
      }
    };
    
    checkConnection();
  }, [backendCheck]);

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  };

  // 노션 작업 목록 가져오기
  const fetchTasks = async () => {
    setLoading(true);
    try {
      console.log('노션 작업 목록 가져오기 시도...');
      const tasksResponse = await axios.get('/notion/tasks');
      console.log('노션 작업 목록 응답:', tasksResponse.data);
      setTasks(tasksResponse.data);
      setLoading(false);
    } catch (err) {
      setError('작업 목록을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
      console.error('작업 목록 로드 오류:', err);
    }
  };

  // 노션 연결하기
  const connectNotion = async () => {
    try {
      setLoading(true);
      setError(null); // 오류 메시지 초기화
      console.log('내부 통합 API 키로 노션 연결 시도...');
      // 내부 통합 방식에서는 auth-status 엔드포인트를 호출하여 API 키 기반 인증 확인
      const authResponse = await axios.get('/notion/auth-status');
      
      // 응답 처리
      if (authResponse.data.apiKeySet) {
        setConnected(true);
        fetchTasks();
        setSnackbarSeverity('success');
        setSnackbarMessage('노션과 연결되었습니다 (내부 통합 방식)');
        setOpenSnackbar(true);
      } else {
        setSnackbarSeverity('error');
        setSnackbarMessage('노션 API 키가 서버에 설정되어 있지 않습니다.');
        setOpenSnackbar(true);
        setLoading(false);
      }
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage('노션 연결 중 오류가 발생했습니다.');
      setOpenSnackbar(true);
      setLoading(false);
      console.error('노션 연결 오류:', err);
    }
  };

  // 다이얼로그 열기
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewTask({
      title: '',
      description: '',
      priority: '중간',
      status: '진행 전'
    });
  };

  // 새 작업 입력 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value
    });
  };

  // 새 작업 추가
  const handleAddTask = async () => {
    if (!newTask.title) {
      setSnackbarSeverity('error');
      setSnackbarMessage('제목을 입력해주세요.');
      setOpenSnackbar(true);
      return;
    }

    try {
      setLoading(true);
      await axios.post('/notion/tasks', newTask);
      await fetchTasks();
      handleCloseDialog();
      setSnackbarSeverity('success');
      setSnackbarMessage('새 작업이 추가되었습니다.');
      setOpenSnackbar(true);
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage('작업 추가 중 오류가 발생했습니다.');
      setOpenSnackbar(true);
      setLoading(false);
      console.error('작업 추가 오류:', err);
    }
  };

  // 작업 상태 변경
  const handleToggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === '완료' ? '진행 중' : '완료';
    
    try {
      setLoading(true);
      console.log(`작업 상태 변경 시도: ${taskId} => ${newStatus}`);
      await axios.put(`/notion/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();
      setSnackbarSeverity('success');
      setSnackbarMessage(`작업 상태가 '${newStatus}'(으)로 변경되었습니다.`);
      setOpenSnackbar(true);
    } catch (err) {
      setSnackbarSeverity('error');
      setSnackbarMessage('작업 상태 변경 중 오류가 발생했습니다.');
      setOpenSnackbar(true);
      setLoading(false);
      console.error('작업 상태 변경 오류:', err);
      
      // 테스트 모드에서는 클라이언트 측에서 상태 변경
      if (taskId.startsWith('test-')) {
        const updatedTasks = tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        );
        setTasks(updatedTasks);
        setSnackbarSeverity('warning');
        setSnackbarMessage(`테스트 모드: 작업 상태가 '${newStatus}'(으)로 변경되었습니다.`);
        setOpenSnackbar(true);
        setLoading(false);
      }
    }
  };

  // 스낵바 닫기
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // 우선순위에 따른 색상 설정
  const getPriorityColor = (priority) => {
    switch (priority) {
      case '높음':
        return 'error';
      case '중간':
        return 'warning';
      case '낮음':
        return 'success';
      default:
        return 'default';
    }
  };

  // 우선순위에 따른 아이콘 설정
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case '높음':
        return <PriorityHighIcon color="error" />;
      case '중간':
        return <PriorityMediumIcon color="warning" />;
      case '낮음':
        return <PriorityLowIcon color="success" />;
      default:
        return <PriorityMediumIcon color="default" />;
    }
  };

  // 상태에 따른 아이콘 설정
  const getStatusIcon = (status) => {
    switch (status) {
      case '완료':
        return <CheckCircleIcon color="success" />;
      case '진행 중':
        return <InProgressIcon color="primary" />;
      case '진행 전':
        return <PendingIcon color="action" />;
      default:
        return <UncheckedIcon />;
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Card elevation={2}>
          <CardHeader
            title={
              <Box display="flex" alignItems="center">
                <NotesIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h4" component="h1">노션 작업 목록</Typography>
              </Box>
            }
            action={
              <Box>
                {connected ? (
                  <>
                    <Tooltip title="작업 목록 새로고침">
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        startIcon={<RefreshIcon />}
                        onClick={fetchTasks}
                        sx={{ mr: 1 }}
                        disabled={loading}
                      >
                        새로고침
                      </Button>
                    </Tooltip>
                    <Tooltip title="새 작업 추가하기">
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddIcon />} 
                        onClick={handleOpenDialog}
                        disabled={loading}
                      >
                        새 작업
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title="Notion API 연결하기">
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<LinkIcon />}
                      onClick={connectNotion}
                    >
                      노션 연결하기
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
          
          {!backendCheck.available && backendCheck.checking === false && (
            <Box px={2}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하고 새로고침하세요.
              </Alert>
            </Box>
          )}

          <CardContent>
            {connected && tasks.length === 0 && !loading ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                <DocumentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  작업이 없습니다. 새 작업을 추가해보세요!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {tasks.map((task) => (
                  <Grid item xs={12} md={6} lg={4} key={task.id}>
                    <Card 
                      variant="outlined" 
                      sx={{
                        height: '100%',
                        transition: 'all 0.2s',
                        bgcolor: task.status === '완료' ? 'rgba(0, 0, 0, 0.03)' : 'background.paper',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardHeader
                        title={
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(task.status)}
                            <Typography 
                              variant="h6" 
                              component="span" 
                              sx={{ 
                                ml: 1,
                                textDecoration: task.status === '완료' ? 'line-through' : 'none',
                                opacity: task.status === '완료' ? 0.7 : 1
                              }}
                            >
                              {task.title}
                            </Typography>
                          </Box>
                        }
                        subheader={
                          <Box display="flex" alignItems="center" mt={1}>
                            <Chip 
                              icon={getPriorityIcon(task.priority)}
                              label={task.priority} 
                              size="small" 
                              color={getPriorityColor(task.priority)} 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              icon={getStatusIcon(task.status)}
                              label={task.status} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: '60px' }}>
                          {task.description || '설명 없음'}
                        </Typography>
                        {task.lastEdited && (
                          <Box display="flex" alignItems="center" mt={2} fontSize="small" color="text.secondary">
                            <TimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">
                              마지막 수정: {formatDate(task.lastEdited)}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                      <CardActions>
                        <Tooltip title={task.status === '완료' ? '미완료로 표시' : '완료로 표시'}>
                          <Button
                            variant="text"
                            color={task.status === '완료' ? 'primary' : 'success'}
                            onClick={() => handleToggleStatus(task.id, task.status)}
                            startIcon={task.status === '완료' ? <InProgressIcon /> : <CheckCircleIcon />}
                            disabled={loading}
                          >
                            {task.status === '완료' ? '미완료로 표시' : '완료로 표시'}
                          </Button>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* 새 작업 추가 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AddIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            새 노션 작업 추가
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="제목"
            type="text"
            fullWidth
            value={newTask.title}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="설명"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={newTask.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>우선순위</InputLabel>
            <Select
              name="priority"
              value={newTask.priority}
              label="우선순위"
              onChange={handleInputChange}
            >
              <MenuItem value="높음">
                <Box display="flex" alignItems="center">
                  <PriorityHighIcon color="error" sx={{ mr: 1 }} />
                  높음
                </Box>
              </MenuItem>
              <MenuItem value="중간">
                <Box display="flex" alignItems="center">
                  <PriorityMediumIcon color="warning" sx={{ mr: 1 }} />
                  중간
                </Box>
              </MenuItem>
              <MenuItem value="낮음">
                <Box display="flex" alignItems="center">
                  <PriorityLowIcon color="success" sx={{ mr: 1 }} />
                  낮음
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>상태</InputLabel>
            <Select
              name="status"
              value={newTask.status}
              label="상태"
              onChange={handleInputChange}
            >
              <MenuItem value="진행 전">
                <Box display="flex" alignItems="center">
                  <PendingIcon sx={{ mr: 1 }} />
                  진행 전
                </Box>
              </MenuItem>
              <MenuItem value="진행 중">
                <Box display="flex" alignItems="center">
                  <InProgressIcon color="primary" sx={{ mr: 1 }} />
                  진행 중
                </Box>
              </MenuItem>
              <MenuItem value="완료">
                <Box display="flex" alignItems="center">
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  완료
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">취소</Button>
          <Button 
            onClick={handleAddTask} 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
          >
            추가
          </Button>
        </DialogActions>
      </Dialog>

      {/* 알림 스낵바 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotionPage;
