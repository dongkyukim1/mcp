import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActionArea,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Button,
  Alert,
  useTheme 
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Description as NotionIcon,
  Chat as SlackIcon,
  Headset as DiscordIcon,
  Email as GmailIcon,
  Folder as DriveIcon,
  TableChart as SheetsIcon,
  Refresh as RefreshIcon,
  AddCircle as AddIcon,
  NotificationsActive as NotificationIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import axios from 'axios';

// 서비스 목록 기본 구조 (연결 상태는 동적으로 업데이트됨)
const servicesList = [
  {
    id: 'notion',
    name: '노션',
    icon: <NotionIcon />,
    color: '#000000',
    route: '/notion',
    statusEndpoint: '/notion/auth-status',
    statusKey: 'apiKeySet' // 또는 'isAuthenticated'
  },
  {
    id: 'github',
    name: '깃허브',
    icon: <GitHubIcon />,
    color: '#171515',
    route: '/github',
    statusEndpoint: '/github/auth-status',
    statusKey: 'isAuthenticated'
  },
  {
    id: 'slack',
    name: '슬랙',
    icon: <SlackIcon />,
    color: '#4A154B',
    route: '/slack',
    statusEndpoint: '/slack/auth-status',
    statusKey: 'isAuthenticated'
  },
  {
    id: 'discord',
    name: '디스코드',
    icon: <DiscordIcon />,
    color: '#5865F2',
    route: '/discord',
    statusEndpoint: '/discord/auth-status',
    statusKey: 'isAuthenticated'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: <GmailIcon />,
    color: '#D44638',
    route: '/gmail',
    statusEndpoint: '/gmail/auth-status',
    statusKey: 'isAuthenticated'
  },
  {
    id: 'drive',
    name: 'Drive',
    icon: <DriveIcon />,
    color: '#0F9D58',
    route: '/drive',
    statusEndpoint: '/drive/auth-status',
    statusKey: 'isAuthenticated'
  },
  {
    id: 'sheets',
    name: 'Sheets',
    icon: <SheetsIcon />,
    color: '#0F9D58',
    route: '/sheets',
    statusEndpoint: '/sheets/auth-status',
    statusKey: 'isAuthenticated'
  }
];

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // 서비스 연결 상태 로드
  const loadServices = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      // 서비스 기본 상태로 초기화
      const servicesWithStatus = servicesList.map(service => ({
        ...service,
        connected: false,
        loading: true,
        error: null
      }));
      
      setServices(servicesWithStatus);
      
      // 각 서비스별 연결 상태 확인 (병렬 처리)
      const statusPromises = servicesWithStatus.map(async (service) => {
        try {
          console.log(`${service.name} 연결 상태 확인 중...`);
          
          // 서비스 연결 상태 확인 API 호출
          const response = await axios.get(service.statusEndpoint, { timeout: 5000 });
          console.log(`${service.name} 상태 응답:`, response.data);
          
          // API 응답에서 연결 상태 확인
          const isConnected = response.data[service.statusKey] === true;
          
          // 특별 케이스: 노션은 두 가지 방법으로 인증 가능
          if (service.id === 'notion' && !isConnected) {
            return {
              ...service,
              connected: response.data.isAuthenticated === true,
              loading: false,
              error: null
            };
          }
          
          return {
            ...service,
            connected: isConnected,
            loading: false,
            error: null
          };
        } catch (err) {
          console.error(`${service.name} 연결 확인 오류:`, err);
          
          // 개발 중인 경우 API가 없는 서비스는 임시로 연결 상태 설정
          // 실제 프로덕션에서는 이 부분 제거
          const devConnectedServices = ['notion', 'github', 'gmail', 'drive', 'sheets'];
          const isDevConnected = process.env.NODE_ENV === 'development' && 
            devConnectedServices.includes(service.id);
          
          return {
            ...service,
            connected: isDevConnected,
            loading: false,
            error: err.message
          };
        }
      });
      
      // 모든 서비스 상태 업데이트 완료 후 상태 설정
      const updatedServices = await Promise.all(statusPromises);
      setServices(updatedServices);
      setLoading(false);
      setRefreshing(false);
      
      // 서비스 상태 로드 후 알림도 로드
      loadNotifications();
    } catch (err) {
      console.error('서비스 상태 로드 중 오류 발생:', err);
      setError('서비스 연결 상태를 확인하는 중 문제가 발생했습니다.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 서비스 알림 로드 함수 추가
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    
    try {
      // 연결된 서비스만 필터링
      const connectedServices = services.filter(service => service.connected);
      
      // 알림 배열 초기화
      let allNotifications = [];
      
      // 각 서비스별 알림 데이터 요청
      for (const service of connectedServices) {
        try {
          // 서비스별 알림 API 호출
          const notifEndpoint = `/${service.id}/notifications/count`;
          console.log(`${service.name} 알림 요청 중... (${notifEndpoint})`);
          
          const response = await axios.get(notifEndpoint, { timeout: 5000 });
          console.log(`${service.name} 알림 응답:`, response.data);
          
          // 알림 카운트가 있는 경우
          if (response.data.count > 0) {
            allNotifications.push({
              id: `${service.id}-${Date.now()}`,
              service: service.name,
              message: `${response.data.count}개의 새 알림이 있습니다`,
              time: '방금 전',
              icon: service.icon,
              color: service.color
            });
          }
        } catch (err) {
          console.error(`${service.name} 알림 로드 오류:`, err);
          // 오류 발생 시 해당 서비스 알림은 건너뜀
        }
      }
      
      // 알림이 없을 경우 개발 환경에서는 테스트 데이터 생성
      if (allNotifications.length === 0 && process.env.NODE_ENV === 'development') {
        const githubService = services.find(s => s.id === 'github');
        const gmailService = services.find(s => s.id === 'gmail');
        const notionService = services.find(s => s.id === 'notion');
        
        if (githubService?.connected) {
          allNotifications.push({
            id: 'github-test',
            service: '깃허브',
            message: '새로운 Pull Request가 생성되었습니다',
            time: '10분 전',
            icon: <GitHubIcon />,
            color: '#171515'
          });
        }
        
        if (gmailService?.connected) {
          allNotifications.push({
            id: 'gmail-test',
            service: 'Gmail',
            message: '3개의 새 이메일이 도착했습니다',
            time: '30분 전',
            icon: <GmailIcon />,
            color: '#D44638'
          });
        }
        
        if (notionService?.connected) {
          allNotifications.push({
            id: 'notion-test',
            service: '노션',
            message: '문서가 업데이트되었습니다',
            time: '1시간 전',
            icon: <NotionIcon />,
            color: '#000000'
          });
        }
      }
      
      setNotifications(allNotifications);
      setLoadingNotifications(false);
    } catch (err) {
      console.error('알림 데이터 로드 중 오류:', err);
      setLoadingNotifications(false);
    }
  };

  // 컴포넌트 마운트 시 서비스 상태 로드
  useEffect(() => {
    loadServices();
  }, []);

  const handleRefresh = () => {
    loadServices();
    loadNotifications();
  };

  const handleServiceClick = (route) => {
    navigate(route);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          MCP - 관리 제어 패널
        </Typography>
        <Box flexGrow={1} />
        <Tooltip title="모든 서비스 새로고침">
          <Button 
            variant="outlined" 
            startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            새로고침
          </Button>
        </Tooltip>
      </Box>

      <Typography variant="h6" sx={{ mb: 3 }}>
        서비스 연결 상태
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} key={service.id}>
            <Card 
              sx={{ 
                height: '100%',
                borderLeft: `4px solid ${service.color}`,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleServiceClick(service.route)}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      sx={{ 
                        bgcolor: service.color,
                        color: '#fff',
                        mr: 2
                      }}
                    >
                      {service.icon}
                    </Avatar>
                    <Typography variant="h6">{service.name}</Typography>
                    <Box flexGrow={1} />
                    {service.loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Chip 
                        label={service.connected ? "연결됨" : "연결 필요"} 
                        size="small"
                        color={service.connected ? "success" : "default"}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {service.loading ? "연결 상태 확인 중..." :
                      service.connected 
                        ? "서비스가 정상적으로 연결되어 있습니다." 
                        : "서비스 연결이 필요합니다. 클릭하여 연결하세요."}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">알림 요약</Typography>
        <Button 
          size="small" 
          startIcon={loadingNotifications ? <CircularProgress size={16} /> : <SyncIcon />}
          onClick={loadNotifications}
          disabled={loadingNotifications}
        >
          동기화
        </Button>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <List>
          {loadingNotifications ? (
            <ListItem>
              <ListItemIcon>
                <CircularProgress size={24} />
              </ListItemIcon>
              <ListItemText primary="알림을 불러오는 중..." />
            </ListItem>
          ) : notifications.length === 0 ? (
            <ListItem>
              <ListItemIcon>
                <NotificationIcon color="disabled" />
              </ListItemIcon>
              <ListItemText 
                primary="새 알림이 없습니다" 
                secondary="연결된 모든 서비스가 최신 상태입니다."
              />
            </ListItem>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem button>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: notification.color }}>
                      {notification.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={notification.message}
                    secondary={`${notification.service} • ${notification.time}`}
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
      
      <Box display="flex" justifyContent="center">
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
        >
          새 서비스 연결하기
        </Button>
      </Box>
    </Container>
  );
}

export default Dashboard;