import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  Divider,
  Paper,
  Avatar,
  ListItemAvatar,
  ListItemText,
  Chip,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  useTheme,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as TimeIcon,
  ArrowBack as BackIcon,
  Launch as LaunchIcon,
  Inbox as InboxIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const Gmail = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const theme = useTheme();

  // URL 파라미터에서 인증 상태 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const errorMessage = urlParams.get('message');

    if (authStatus === 'success') {
      console.log('인증 성공 파라미터를 감지했습니다.');
      localStorage.setItem('gmailAuth', 'true');
      setIsAuthenticated(true);
      // 인증 성공 시 바로 메시지 로드 시도
      setMessagesLoading(true);
      
      // 2초 후에 메시지 로드 시도 (토큰이 서버에 저장되는 시간을 고려)
      setTimeout(() => {
        fetchMessages();
      }, 2000);
      
      // 성공 파라미터 제거
      window.history.replaceState({}, document.title, '/gmail');
    } else if (authStatus === 'error' && errorMessage) {
      setError(`인증 오류: ${errorMessage}`);
      // 오류 파라미터 제거
      window.history.replaceState({}, document.title, '/gmail');
    }
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      setAuthLoading(true);
      try {
        // 직접 서버 URL 사용 및 credentials 옵션 추가
        const response = await axios.get('http://localhost:5000/api/gmail/auth-status', {
          withCredentials: true
        });
        console.log('인증 상태 응답:', response.data);
        setIsAuthenticated(response.data.isAuthenticated);
        
        if (response.data.isAuthenticated) {
          localStorage.setItem('gmailAuth', 'true');
        } else {
          localStorage.removeItem('gmailAuth');
        }
      } catch (error) {
        console.error('Gmail 인증 상태 확인 오류:', error);
        
        // 로컬 스토리지에 인증 정보가 있으면 인증된 것으로 처리
        if (localStorage.getItem('gmailAuth') === 'true') {
          console.log('로컬 스토리지에서 인증 정보 발견');
          setIsAuthenticated(true);
        } else {
          setError('Gmail 인증 상태를 확인하는 중 오류가 발생했습니다.');
          setIsAuthenticated(false);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 메시지 목록 가져오기
  const fetchMessages = async () => {
    if (!isAuthenticated) return;
    
    setMessagesLoading(true);
    setError(null);
    
    try {
      // 직접 서버 URL 사용 및 credentials 옵션 추가
      const response = await axios.get('http://localhost:5000/api/gmail/messages', {
        withCredentials: true
      });
      console.log('메시지 목록 응답:', response.data);
      setMessages(response.data);
    } catch (error) {
      console.error('Gmail 메시지 가져오기 오류:', error);
      setError('메시지를 가져오는 중 오류가 발생했습니다.');
      
      // 인증 오류인 경우 인증 상태 업데이트
      if (error.response && error.response.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('gmailAuth');
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  // 메시지 상세 정보 가져오기
  const fetchMessageDetails = async (messageId) => {
    setMessageLoading(true);
    setError(null);
    
    try {
      // 직접 서버 URL 사용 및 credentials 옵션 추가
      const response = await axios.get(`http://localhost:5000/api/gmail/messages/${messageId}`, {
        withCredentials: true
      });
      setSelectedMessage(response.data);
    } catch (error) {
      console.error('Gmail 메시지 상세 정보 가져오기 오류:', error);
      setError('메시지 상세 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setMessageLoading(false);
    }
  };

  // 인증 후 메시지 가져오기
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchMessages();
    }
  }, [isAuthenticated, authLoading]);

  // 날짜 형식화 함수
  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return format(date, "a h:mm", { locale: ko });
    } else if (isYesterday(date)) {
      return '어제';
    } else {
      return format(date, "M월 d일", { locale: ko });
    }
  };

  // 인증 페이지로 이동
  const handleAuth = () => {
    // 직접 서버 URL로 리디렉션
    window.location.href = 'http://localhost:5000/api/gmail/auth';
  };

  // 메시지 목록으로 돌아가기
  const handleBackToList = () => {
    setSelectedMessage(null);
  };

  // 로딩 표시
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // 안읽은 메일 개수 계산
  const unreadCount = messages.filter(message => !message.isRead).length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* 페이지 헤더 */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {selectedMessage ? (
              <IconButton
                onClick={handleBackToList}
                sx={{ mr: 1, bgcolor: 'rgba(0,0,0,0.04)' }}
                size="small"
              >
                <BackIcon />
              </IconButton>
            ) : (
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: '#D44638', 
                  mr: 1.5,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              >
                <EmailIcon />
              </Avatar>
            )}
            <Typography variant="h5" component="h1" fontWeight="500">
              {selectedMessage ? selectedMessage.subject : 'Gmail'}
              {!selectedMessage && unreadCount > 0 && (
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          </Box>
          <Box>
            {isAuthenticated && (
              <>
                <Tooltip title="새로고침">
                  <IconButton 
                    onClick={fetchMessages} 
                    disabled={messagesLoading}
                    sx={{ mr: 1 }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleAuth}
                  sx={{ fontWeight: 500 }}
                >
                  인증됨
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<EmailIcon />}
                onClick={handleAuth}
                sx={{ fontWeight: 500 }}
              >
                Gmail 인증하기
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} variant="filled">
          <AlertTitle>오류</AlertTitle>
          {error}
        </Alert>
      )}

      {!isAuthenticated ? (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px dashed #ddd' }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: '#D44638', mx: 'auto', mb: 3 }}>
            <EmailIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Gmail 계정 인증이 필요합니다
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            Gmail 메시지를 확인하려면 Google 계정으로 인증해야 합니다. 아래 버튼을 클릭하여 인증을 진행해주세요.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleAuth}
            sx={{ 
              mt: 2, 
              bgcolor: '#D44638',
              '&:hover': {
                bgcolor: '#B93C2F'
              },
              px: 4,
              py: 1.5
            }}
          >
            Gmail 인증하기
          </Button>
        </Paper>
      ) : selectedMessage ? (
        <Card elevation={0} sx={{ borderRadius: 2, overflow: 'visible' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {messageLoading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box display="flex" alignItems="center" mb={2} flexWrap="wrap">
                  <Avatar sx={{ bgcolor: '#D44638', mr: 2, width: 48, height: 48 }}>
                    {selectedMessage.from.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: '200px' }}>
                    <Typography variant="subtitle1" fontWeight="500">
                      {selectedMessage.from}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      받는 사람: {selectedMessage.to}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}>
                    {new Date(selectedMessage.date).toLocaleString('ko-KR')}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mt: 3 }}>
                  {selectedMessage.needReauth ? (
                    <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#FFF4E5', borderRadius: 2 }}>
                      <Typography variant="h6" color="error" gutterBottom>
                        권한이 필요합니다
                      </Typography>
                      <Typography variant="body1" color="error.main" paragraph>
                        {selectedMessage.body}
                      </Typography>
                      {selectedMessage.errorInfo && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          오류 정보: {selectedMessage.errorInfo}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Google 인증 화면에서 <strong>반드시 모든 권한에 동의</strong>해주세요. 특히 '이메일 메시지 읽기' 및 '첨부 파일 보기' 권한이 필요합니다.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleAuth}
                        sx={{ mt: 2 }}
                      >
                        Gmail 다시 인증하기
                      </Button>
                    </Box>
                  ) : selectedMessage.body ? (
                    <Box sx={{ 
                      p: 1,
                      '& img': { maxWidth: '100%' },
                      '& pre': { 
                        overflow: 'auto', 
                        backgroundColor: '#f5f5f5', 
                        padding: '12px',
                        borderRadius: '4px'
                      }
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: selectedMessage.body }} />
                    </Box>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      내용 없음
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {messagesLoading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : messages.length > 0 ? (
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <List disablePadding>
                {messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem 
                      alignItems="flex-start" 
                      button
                      onClick={() => fetchMessageDetails(message.id)}
                      sx={{
                        bgcolor: message.isRead ? 'inherit' : alpha(theme.palette.primary.light, 0.08),
                        borderLeft: message.isRead ? 'none' : `3px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.light, 0.15)
                        },
                        py: 1.5,
                        transition: 'all 0.2s'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: message.isRead ? '#9E9E9E' : '#D44638' }}>
                          {message.from && message.from.split('@')[0].charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography
                              variant="subtitle1"
                              component="span"
                              sx={{ 
                                fontWeight: message.isRead ? 'normal' : 'bold',
                                mr: 1,
                                color: message.isRead ? 'text.primary' : 'text.primary'
                              }}
                            >
                              {message.subject}
                            </Typography>
                            {!message.isRead && (
                              <Chip 
                                label="안읽음" 
                                size="small" 
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  bgcolor: '#D44638',
                                  color: 'white' 
                                }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{ display: 'inline', fontWeight: message.isRead ? 'normal' : 'medium' }}
                            >
                              {message.from && message.from.split('<')[0].trim()}
                            </Typography>
                            {" — "}
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ 
                                display: 'inline',
                                fontWeight: message.isRead ? 'normal' : 'medium',
                                color: message.isRead ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {message.snippet}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                      <Box display="flex" alignItems="center" ml={2}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            fontWeight: message.isRead ? 'normal' : 'bold' 
                          }}
                        >
                          <TimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          {formatDate(message.date)}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < messages.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <InboxIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                메시지가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                메시지를 불러올 수 없거나 계정에 메시지가 없습니다.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
                onClick={fetchMessages}
              >
                새로고침
              </Button>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

// MUI의 alpha 함수 구현 (theme.palette.primary.light의 투명도를 조절하기 위함)
const alpha = (color, opacity) => {
  // 이미 rgba 형식이면 불투명도만 변경
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\((.+?),.+?\)/, `rgba($1, ${opacity})`);
  }
  
  // hex 색상을 rgba로 변환
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // 기본적으로 불투명도를 조절한 색상 반환
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export default Gmail; 