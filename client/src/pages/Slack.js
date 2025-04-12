import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  CircularProgress, 
  Avatar, 
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Chat as ChatIcon, 
  Send as SendIcon, 
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Tag as TagIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
  EmojiEmotions as EmojiIcon,
  Add as AddIcon
} from '@mui/icons-material';

// 테스트 채널 데이터
const mockChannels = [
  { id: '1', name: '일반', unread: 2 },
  { id: '2', name: '마케팅', unread: 0 },
  { id: '3', name: '개발', unread: 5 },
  { id: '4', name: '디자인', unread: 0 },
  { id: '5', name: '영업', unread: 1 }
];

// 테스트 DM 데이터
const mockDMs = [
  { id: '1', name: '홍길동', status: 'online', unread: 3 },
  { id: '2', name: '김철수', status: 'offline', unread: 0 },
  { id: '3', name: '이영희', status: 'away', unread: 1 }
];

// 테스트 메시지 데이터
const mockMessages = [
  {
    id: '1',
    user: { id: '1', name: '홍길동', avatar: '🧑' },
    content: '안녕하세요! 오늘 회의 시간이 어떻게 되나요?',
    timestamp: '오전 10:15',
    reactions: [
      { emoji: '👍', count: 2 },
      { emoji: '👀', count: 1 }
    ]
  },
  {
    id: '2',
    user: { id: '2', name: '김철수', avatar: '👨' },
    content: '오후 2시에 예정되어 있습니다.',
    timestamp: '오전 10:17',
    reactions: []
  },
  {
    id: '3',
    user: { id: '3', name: '이영희', avatar: '👩' },
    content: '저는 회의 참석 어려울 것 같습니다. 회의록 공유 부탁드립니다.',
    timestamp: '오전 10:20',
    reactions: [
      { emoji: '👍', count: 1 }
    ]
  },
  {
    id: '4',
    user: { id: '1', name: '홍길동', avatar: '🧑' },
    content: '네, 알겠습니다. 회의 후 공유해드리겠습니다.',
    timestamp: '오전 10:25',
    reactions: [
      { emoji: '🙏', count: 2 }
    ]
  },
  {
    id: '5',
    user: { id: '4', name: '시스템', avatar: '🤖' },
    content: '홍길동님이 파일을 공유했습니다: 회의 안건.docx',
    isSystem: true,
    timestamp: '오전 11:05',
    reactions: []
  }
];

const Slack = () => {
  const theme = useTheme();
  const [channels, setChannels] = useState([]);
  const [dms, setDMs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // 데이터 로드
  useEffect(() => {
    const loadSlackData = async () => {
      setLoading(true);
      try {
        // 실제로는 API 호출로 데이터를 가져오지만 현재는 목업 데이터 사용
        setTimeout(() => {
          setChannels(mockChannels);
          setDMs(mockDMs);
          setMessages(mockMessages);
          setCurrentChannel({ id: '1', name: '일반', type: 'channel' });
          setConnected(true);
          setLoading(false);
        }, 1000);

        /* 실제 API 연동 시 사용할 코드
        const statusRes = await axios.get('/slack/auth-status');
        if (statusRes.data.isAuthenticated) {
          const channelsRes = await axios.get('/slack/channels');
          const dmsRes = await axios.get('/slack/dms');
          
          setChannels(channelsRes.data);
          setDMs(dmsRes.data);
          setConnected(true);
          
          if (channelsRes.data.length > 0) {
            setCurrentChannel({ id: channelsRes.data[0].id, name: channelsRes.data[0].name, type: 'channel' });
            const messagesRes = await axios.get(`/slack/channels/${channelsRes.data[0].id}/messages`);
            setMessages(messagesRes.data);
          }
        } else {
          setError('Slack에 연결되어 있지 않습니다. 연결 설정을 확인해주세요.');
        }
        */
      } catch (err) {
        console.error('Slack 데이터 로드 오류:', err);
        setError('Slack 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSlackData();
  }, []);

  // Slack 연결 핸들러
  const handleConnect = () => {
    setLoading(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setConnected(true);
      setChannels(mockChannels);
      setDMs(mockDMs);
      setMessages(mockMessages);
      setCurrentChannel({ id: '1', name: '일반', type: 'channel' });
      setLoading(false);
    }, 1000);
  };

  // 채널 또는 DM 선택 핸들러
  const handleSelectChannel = (id, name, type) => {
    setCurrentChannel({ id, name, type });
    // 실제로는 API 호출로 선택한 채널의 메시지를 가져옴
  };

  // 메시지 전송 핸들러
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    // 메시지 상태에 새 메시지 추가 (실제로는 API 호출)
    const newMessage = {
      id: String(Date.now()),
      user: { id: 'current-user', name: '나', avatar: '😎' },
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: []
    };
    
    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!connected && !loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <ChatIcon sx={{ fontSize: 72, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" gutterBottom>Slack에 연결되지 않음</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Slack에 연결하여 팀과 실시간으로 소통하세요.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
            >
              Slack 연결하기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      {/* 사이드바 (채널 및 DM 목록) */}
      <Box
        sx={{
          width: 260,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Box sx={{ p: 2 }}>
          <TextField 
            fullWidth
            placeholder="검색"
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </Box>

        <Typography 
          variant="subtitle2" 
          sx={{ px: 3, py: 1, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
        >
          <TagIcon fontSize="small" sx={{ mr: 1 }} /> 채널
        </Typography>
        
        <List dense>
          {channels.map((channel) => (
            <ListItem 
              key={channel.id} 
              button
              selected={currentChannel?.id === channel.id && currentChannel?.type === 'channel'}
              onClick={() => handleSelectChannel(channel.id, channel.name, 'channel')}
              sx={{
                px: 3,
                py: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ListItemText primary={`# ${channel.name}`} />
              {channel.unread > 0 && (
                <Chip 
                  label={channel.unread} 
                  size="small" 
                  color="primary" 
                  sx={{ height: 20, minWidth: 20 }} 
                />
              )}
            </ListItem>
          ))}
          <ListItem button sx={{ px: 3, color: theme.palette.text.secondary }}>
            <AddIcon fontSize="small" sx={{ mr: 1 }} />
            <ListItemText primary="채널 추가" />
          </ListItem>
        </List>

        <Typography 
          variant="subtitle2" 
          sx={{ px: 3, py: 1, mt: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
        >
          <GroupIcon fontSize="small" sx={{ mr: 1 }} /> 다이렉트 메시지
        </Typography>
        
        <List dense>
          {dms.map((dm) => (
            <ListItem 
              key={dm.id} 
              button
              selected={currentChannel?.id === dm.id && currentChannel?.type === 'dm'}
              onClick={() => handleSelectChannel(dm.id, dm.name, 'dm')}
              sx={{
                px: 3,
                py: 0.5,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ListItemAvatar sx={{ minWidth: 32 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: dm.status === 'online' ? 'success.main' : 
                             dm.status === 'away' ? 'warning.main' : 'text.disabled',
                    mr: 1,
                    display: 'inline-block'
                  }} 
                />
              </ListItemAvatar>
              <ListItemText primary={dm.name} />
              {dm.unread > 0 && (
                <Chip 
                  label={dm.unread} 
                  size="small" 
                  color="primary" 
                  sx={{ height: 20, minWidth: 20 }} 
                />
              )}
            </ListItem>
          ))}
          <ListItem button sx={{ px: 3, color: theme.palette.text.secondary }}>
            <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
            <ListItemText primary="새 메시지 시작" />
          </ListItem>
        </List>
      </Box>

      {/* 메인 콘텐츠 (메시지) */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 채널 헤더 */}
        {currentChannel && (
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6">
              {currentChannel.type === 'channel' ? `# ${currentChannel.name}` : currentChannel.name}
            </Typography>
            <Box flexGrow={1} />
            <Tooltip title="새로고침">
              <IconButton onClick={() => console.log('새로고침')}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* 메시지 목록 */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                ...(message.isSystem ? {
                  justifyContent: 'center',
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                } : {})
              }}
            >
              {!message.isSystem && (
                <Avatar sx={{ mr: 2, bgcolor: message.user.id === 'current-user' ? theme.palette.primary.main : theme.palette.secondary.main }}>
                  {message.user.avatar}
                </Avatar>
              )}
              <Box sx={{ flex: 1 }}>
                {!message.isSystem && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {message.user.name}
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
                      {message.timestamp}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body1">
                  {message.content}
                </Typography>
                {message.reactions.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                    {message.reactions.map((reaction, index) => (
                      <Chip
                        key={index}
                        label={`${reaction.emoji} ${reaction.count}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24, borderRadius: 3 }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* 메시지 입력 */}
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            placeholder={`${currentChannel ? currentChannel.type === 'channel' ? `#${currentChannel.name}` : currentChannel.name : ''}에 메시지 보내기`}
            maxRows={3}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small">
                    <EmojiIcon />
                  </IconButton>
                  <IconButton size="small">
                    <FileIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <IconButton 
            color="primary" 
            type="submit"
            disabled={!messageInput.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Slack; 