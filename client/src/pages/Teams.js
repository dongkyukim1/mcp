import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider, 
  Button, 
  TextField, 
  CircularProgress, 
  IconButton, 
  Tooltip, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Badge, 
  Chip,
  Alert
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Refresh as RefreshIcon,
  Videocam as VideocamIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLocation, useNavigate } from 'react-router-dom';

const TeamsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chats, setChats] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
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
          const response = await axios.post('/api/teams/auth-token', { code });
          
          if (response.data.success) {
            setStatusMessage('인증 완료! 데이터를 로드합니다...');
            // URL에서 코드 제거 (보안상 이유)
            navigate('/teams', { replace: true });
            
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

  // 팀즈 인증 상태 확인
  const checkConnection = async () => {
    try {
      const authResponse = await axios.get('/api/teams/auth-status');
      setConnected(authResponse.data.isAuthenticated);
      
      if (authResponse.data.isAuthenticated) {
        fetchData();
      } else {
        setLoading(false);
        setError('팀즈 계정에 연결되어 있지 않습니다.');
      }
    } catch (err) {
      setLoading(false);
      setError('팀즈 연결 상태를 확인하는 중 오류가 발생했습니다.');
      console.error('팀즈 연결 확인 오류:', err);
    }
  };

  // 팀즈 데이터 가져오기
  const fetchData = async () => {
    setLoading(true);
    try {
      const [chatsResponse, meetingsResponse] = await Promise.all([
        axios.get('/api/teams/chats'),
        axios.get('/api/teams/meetings')
      ]);
      
      setChats(chatsResponse.data);
      setMeetings(meetingsResponse.data);
      setLoading(false);
      setStatusMessage('');
    } catch (err) {
      setError('팀즈 데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
      setStatusMessage('');
      console.error('팀즈 데이터 로드 오류:', err);
    }
  };

  // 팀즈 연결하기
  const connectTeams = async () => {
    try {
      setStatusMessage('인증 URL 가져오는 중...');
      const response = await axios.get('/api/teams/auth-url');
      window.location.href = response.data.url;
    } catch (err) {
      setError('팀즈 연결 URL을 가져오는 중 오류가 발생했습니다.');
      setStatusMessage('');
      console.error('팀즈 연결 URL 오류:', err);
    }
  };

  // 채팅 선택
  const handleSelectChat = async (chatId) => {
    try {
      setLoading(true);
      const chatResponse = await axios.get(`/api/teams/chats/${chatId}/messages`);
      setSelectedChat({
        ...chats.find(chat => chat.id === chatId),
        messages: chatResponse.data
      });
      setLoading(false);
      
      // 읽음 상태 업데이트
      if (chatResponse.data.unreadCount > 0) {
        await axios.post(`/api/teams/chats/${chatId}/read`);
        fetchData(); // 읽음 상태가 업데이트되면 채팅 목록 다시 불러오기
      }
    } catch (err) {
      setError('채팅 메시지를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
      console.error('채팅 메시지 로드 오류:', err);
    }
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      setLoading(true);
      await axios.post(`/api/teams/chats/${selectedChat.id}/messages`, {
        content: newMessage
      });
      setNewMessage('');
      handleSelectChat(selectedChat.id); // 메시지 전송 후 채팅 다시 불러오기
    } catch (err) {
      setError('메시지 전송 중 오류가 발생했습니다.');
      setLoading(false);
      console.error('메시지 전송 오류:', err);
    }
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

  // 회의 시간 포맷팅
  const formatMeetingTime = (start, end) => {
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

  // 회의 참여 링크 열기
  const openMeeting = (joinUrl) => {
    window.open(joinUrl, '_blank');
  };

  if (statusMessage) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress sx={{ mb: 3 }} />
        <Typography variant="h6">{statusMessage}</Typography>
      </Box>
    );
  }

  if (loading && !chats.length && !meetings.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">팀즈</Typography>
        <Box>
          {connected ? (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<RefreshIcon />}
              onClick={fetchData}
              disabled={loading}
            >
              새로고침
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={connectTeams}
            >
              팀즈 연결하기
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
          <Grid container spacing={3}>
            {/* 채팅 섹션 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <ChatIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">채팅</Typography>
                  <Badge 
                    badgeContent={chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)} 
                    color="error" 
                    sx={{ ml: 1 }}
                    max={99}
                  />
                </Box>
                
                {chats.length === 0 ? (
                  <Typography align="center" color="textSecondary">
                    채팅이 없습니다.
                  </Typography>
                ) : (
                  <>
                    <List sx={{ overflow: 'auto', maxHeight: 300, mb: 2 }}>
                      {chats.map((chat, index) => (
                        <React.Fragment key={chat.id}>
                          {index > 0 && <Divider />}
                          <ListItem 
                            button 
                            onClick={() => handleSelectChat(chat.id)}
                            selected={selectedChat && selectedChat.id === chat.id}
                            sx={{
                              bgcolor: chat.unreadCount > 0 ? 'action.hover' : 'inherit',
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar alt={chat.title || 'Chat'} src="/static/images/avatar/1.jpg">
                                {chat.type === 'group' ? <GroupIcon /> : (chat.title?.charAt(0) || 'C')}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={
                                <Box display="flex" alignItems="center">
                                  <Typography variant="body1">
                                    {chat.title || '제목 없음'}
                                  </Typography>
                                  {chat.unreadCount > 0 && (
                                    <Badge 
                                      badgeContent={chat.unreadCount} 
                                      color="error" 
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={chat.lastMessage ? 
                                `${chat.lastMessage.from || ''}: ${chat.lastMessage.content?.substring(0, 30) || '내용 없음'}${chat.lastMessage.content?.length > 30 ? '...' : ''}` : 
                                '새 대화를 시작하세요'
                              }
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>

                    {selectedChat && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {selectedChat.title || '제목 없음'}
                        </Typography>
                        
                        <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                          {selectedChat.messages && selectedChat.messages.map((message) => (
                            <Box 
                              key={message.id} 
                              sx={{ 
                                mb: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.isFromMe ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 0.5 
                                }}
                              >
                                {!message.isFromMe && (
                                  <Avatar 
                                    sx={{ width: 24, height: 24, mr: 1 }}
                                    alt={message.from || '사용자'}
                                  >
                                    {message.from?.charAt(0) || 'U'}
                                  </Avatar>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {message.isFromMe ? '나' : (message.from || '사용자')} • {formatDate(message.createdDateTime || new Date())}
                                </Typography>
                              </Box>
                              <Paper 
                                sx={{ 
                                  p: 1, 
                                  maxWidth: '70%',
                                  bgcolor: message.isFromMe ? 'primary.light' : 'background.paper',
                                  color: message.isFromMe ? 'primary.contrastText' : 'text.primary'
                                }}
                              >
                                <Typography variant="body2">
                                  {message.content || '내용 없음'}
                                </Typography>
                              </Paper>
                            </Box>
                          ))}
                        </Box>
                        
                        <Box display="flex">
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="메시지를 입력하세요..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <IconButton 
                            color="primary" 
                            sx={{ ml: 1 }}
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                          >
                            <SendIcon />
                          </IconButton>
                        </Box>
                      </Paper>
                    )}
                  </>
                )}
              </Paper>
            </Grid>

            {/* 회의 섹션 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <VideocamIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">회의</Typography>
                  <Badge 
                    badgeContent={meetings.filter(m => new Date(m.startDateTime) > new Date()).length} 
                    color="primary" 
                    sx={{ ml: 1 }}
                    max={99}
                  />
                </Box>
                
                {meetings.length === 0 ? (
                  <Typography align="center" color="textSecondary">
                    예정된 회의가 없습니다.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {meetings.map((meeting) => {
                      const now = new Date();
                      const startTime = new Date(meeting.startDateTime);
                      const endTime = new Date(meeting.endDateTime);
                      const isUpcoming = startTime > now;
                      const isOngoing = startTime <= now && endTime >= now;
                      const isPast = endTime < now;
                      
                      return (
                        <Grid item xs={12} key={meeting.id}>
                          <Card 
                            sx={{ 
                              bgcolor: isOngoing ? 'success.light' : isUpcoming ? 'info.light' : 'action.hover' 
                            }}
                          >
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="h6">
                                  {meeting.subject || '제목 없음'}
                                </Typography>
                                <Chip 
                                  label={isOngoing ? "진행중" : isUpcoming ? "예정됨" : "종료됨"}
                                  color={isOngoing ? "success" : isUpcoming ? "primary" : "default"}
                                  size="small"
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                <ScheduleIcon fontSize="small" sx={{ mb: -0.5, mr: 1 }} />
                                {formatMeetingTime(meeting.startDateTime, meeting.endDateTime)}
                              </Typography>
                              {meeting.organizer && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>주최자:</strong> {meeting.organizer.name || meeting.organizer.email || '알 수 없음'}
                                </Typography>
                              )}
                              {meeting.attendees && meeting.attendees.length > 0 && (
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>참석자:</strong> {meeting.attendees.map(a => a.name || a.email || '알 수 없음').join(', ')}
                                </Typography>
                              )}
                            </CardContent>
                            {(isOngoing || isUpcoming) && meeting.joinUrl && (
                              <CardActions>
                                <Button 
                                  variant="contained" 
                                  color={isOngoing ? "success" : "primary"}
                                  size="small" 
                                  onClick={() => openMeeting(meeting.joinUrl)}
                                  startIcon={<VideocamIcon />}
                                  fullWidth
                                >
                                  {isOngoing ? "지금 참여하기" : "회의 참여 준비"}
                                </Button>
                              </CardActions>
                            )}
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default TeamsPage;
