import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  ListItemAvatar, 
  Avatar, 
  Divider, 
  Button, 
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Chip,
  Badge,
  Alert
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Event as EventIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Drafts as DraftsIcon,
  MarkunreadMailbox as UnreadIcon,
  Star as StarIcon,
  Reply as ReplyIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`outlook-tabpanel-${index}`}
      aria-labelledby={`outlook-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const OutlookPage = () => {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emails, setEmails] = useState([]);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  // URL 파라미터에서 인증 코드 추출
  useEffect(() => {
    const handleAuthCode = async () => {
      const query = new URLSearchParams(location.search);
      const code = query.get('code');
      const error = query.get('error');
      
      if (error) {
        setError(`인증 오류: ${query.get('error_description') || error}`);
        setLoading(false);
        return;
      }
      
      if (code) {
        try {
          setStatusMessage('인증 코드를 토큰으로 교환 중...');
          const response = await axios.post('/api/outlook/auth-token', { code });
          
          if (response.data.success) {
            setStatusMessage('인증 완료! 데이터를 로드합니다...');
            // URL에서 코드 제거 (보안상 이유)
            navigate('/outlook', { replace: true });
            
            // 데이터 로드
            await fetchData();
          }
        } catch (err) {
          console.error('인증 코드 교환 오류:', err);
          setError(`인증 처리 중 오류가 발생했습니다: ${err.response?.data?.error || err.message}`);
          setLoading(false);
        }
      } else {
        checkConnection();
      }
    };
    
    handleAuthCode();
  }, [location, navigate]);

  // 아웃룩 인증 및 데이터 로드
  const checkConnection = async () => {
    try {
      const authResponse = await axios.get('/api/outlook/auth-status');
      setConnected(authResponse.data.isAuthenticated);
      
      if (authResponse.data.isAuthenticated) {
        fetchData();
      } else {
        setLoading(false);
        setError('아웃룩 계정에 연결되어 있지 않습니다.');
      }
    } catch (err) {
      setLoading(false);
      setError('아웃룩 연결 상태를 확인하는 중 오류가 발생했습니다.');
      console.error('아웃룩 연결 확인 오류:', err);
    }
  };

  // 아웃룩 데이터 가져오기
  const fetchData = async () => {
    setLoading(true);
    try {
      const [emailsResponse, eventsResponse] = await Promise.all([
        axios.get('/api/outlook/emails'),
        axios.get('/api/outlook/events')
      ]);
      
      setEmails(emailsResponse.data);
      setEvents(eventsResponse.data);
      setLoading(false);
      setStatusMessage('');
    } catch (err) {
      setError('아웃룩 데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
      setStatusMessage('');
      console.error('아웃룩 데이터 로드 오류:', err);
    }
  };

  // 아웃룩 연결하기
  const connectOutlook = async () => {
    try {
      setStatusMessage('인증 URL 가져오는 중...');
      const response = await axios.get('/api/outlook/auth-url');
      window.location.href = response.data.url;
    } catch (err) {
      setError('아웃룩 연결 URL을 가져오는 중 오류가 발생했습니다.');
      setStatusMessage('');
      console.error('아웃룩 연결 URL 오류:', err);
    }
  };

  // 이메일 읽음 상태 변경
  const toggleReadStatus = async (emailId, isRead) => {
    try {
      await axios.put(`/api/outlook/emails/${emailId}`, {
        isRead: !isRead
      });
      await fetchData();
    } catch (err) {
      setError('이메일 상태 변경 중 오류가 발생했습니다.');
      console.error('이메일 상태 변경 오류:', err);
    }
  };

  // 로그아웃 기능 
  const handleLogout = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/outlook/logout');
      
      if (response.data.success) {
        setConnected(false);
        setEmails([]);
        setEvents([]);
        setError(null);
        setStatusMessage('로그아웃 되었습니다.');
        
        // 상태 메시지 2초 후 제거
        setTimeout(() => {
          setStatusMessage('');
        }, 2000);
      }
    } catch (err) {
      setError('로그아웃 중 오류가 발생했습니다.');
      console.error('로그아웃 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      return dateString;
    }
  };

  // 일정 시간 포맷팅
  const formatEventTime = (start, end) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const isSameDay = 
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate();
      
      if (isSameDay) {
        return `${format(startDate, 'yyyy년 MM월 dd일 HH:mm')} - ${format(endDate, 'HH:mm', { locale: ko })}`;
      } else {
        return `${format(startDate, 'yyyy년 MM월 dd일 HH:mm')} - ${format(endDate, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}`;
      }
    } catch (err) {
      return `${start} - ${end}`;
    }
  };

  if (statusMessage) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="h6">{statusMessage}</Typography>
      </Box>
    );
  }

  if (loading && !emails.length && !events.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">아웃룩</Typography>
        <Box>
          {connected ? (
            <>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                로그아웃
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                disabled={loading}
              >
                새로고침
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={connectOutlook}
            >
              아웃룩 연결하기
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {connected && (
        <>
          <Paper sx={{ width: '100%', mb: 3 }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="아웃룩 탭"
              centered
            >
              <Tab 
                icon={<EmailIcon />} 
                label={
                  <Badge 
                    badgeContent={emails.filter(email => !email.isRead).length} 
                    color="error"
                    max={99}
                  >
                    이메일
                  </Badge>
                } 
                id="outlook-tab-0"
                aria-controls="outlook-tabpanel-0" 
              />
              <Tab 
                icon={<EventIcon />} 
                label={
                  <Badge 
                    badgeContent={events.filter(event => new Date(event.start) > new Date()).length} 
                    color="primary"
                    max={99}
                  >
                    일정
                  </Badge>
                } 
                id="outlook-tab-1" 
                aria-controls="outlook-tabpanel-1" 
              />
            </Tabs>

            <TabPanel value={value} index={0}>
              {emails.length === 0 ? (
                <Typography align="center" color="textSecondary">
                  이메일이 없습니다.
                </Typography>
              ) : (
                <List>
                  {emails.map((email, index) => (
                    <React.Fragment key={email.id}>
                      {index > 0 && <Divider variant="inset" component="li" />}
                      <ListItem 
                        alignItems="flex-start"
                        sx={{
                          bgcolor: email.isRead ? 'inherit' : 'action.hover',
                          transition: 'background-color 0.3s'
                        }}
                        secondaryAction={
                          <Box>
                            <Tooltip title={email.isRead ? "읽지 않음으로 표시" : "읽음으로 표시"}>
                              <IconButton 
                                edge="end" 
                                onClick={() => toggleReadStatus(email.id, email.isRead)}
                              >
                                {email.isRead ? <DraftsIcon /> : <UnreadIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="답장">
                              <IconButton edge="end">
                                <ReplyIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar alt={email.from?.name || 'User'} src="/static/images/avatar/1.jpg">
                            {email.from?.name?.charAt(0) || 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography
                                component="span"
                                variant="body1"
                                fontWeight={email.isRead ? 'normal' : 'bold'}
                              >
                                {email.subject}
                              </Typography>
                              {email.importance === 'high' && (
                                <Tooltip title="중요">
                                  <StarIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {email.from?.name || 'Unknown'} ({email.from?.address || 'no-email'})
                              </Typography>
                              <Typography variant="body2" component="div">
                                {email.bodyPreview?.substring(0, 100) || '내용 없음'}
                                {email.bodyPreview?.length > 100 ? '...' : ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(email.receivedDateTime)}
                              </Typography>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={value} index={1}>
              {events.length === 0 ? (
                <Typography align="center" color="textSecondary">
                  일정이 없습니다.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {events.map((event) => {
                    const isUpcoming = new Date(event.start) > new Date();
                    const isOngoing = new Date(event.start) <= new Date() && new Date(event.end) >= new Date();
                    
                    return (
                      <Grid item xs={12} md={6} key={event.id}>
                        <Card 
                          sx={{ 
                            mb: 2, 
                            bgcolor: isOngoing ? 'success.light' : isUpcoming ? 'info.light' : 'action.hover',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}
                        >
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Typography variant="h6" gutterBottom>
                                {event.subject}
                              </Typography>
                              <Chip 
                                label={isOngoing ? "진행중" : isUpcoming ? "예정됨" : "완료됨"} 
                                color={isOngoing ? "success" : isUpcoming ? "primary" : "default"}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <EventIcon fontSize="small" sx={{ mb: -0.5, mr: 1 }} />
                              {formatEventTime(event.start, event.end)}
                            </Typography>
                            {event.location && (
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>장소:</strong> {event.location}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              {event.bodyPreview?.substring(0, 150) || '설명 없음'}
                              {event.bodyPreview?.length > 150 ? '...' : ''}
                            </Typography>
                            {event.attendees && event.attendees.length > 0 && (
                              <Box mt={1}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>참석자:</strong> {event.attendees.map(a => a.name).join(', ')}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default OutlookPage;
