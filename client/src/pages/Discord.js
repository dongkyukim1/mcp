import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemAvatar,
  Paper, 
  CircularProgress, 
  Avatar, 
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Headset as DiscordIcon, 
  Settings as SettingsIcon,
  Send as SendIcon, 
  Link as LinkIcon,
  Refresh as RefreshIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  EmojiEmotions as EmojiIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  People as PeopleIcon,
  PeopleOutline as PeopleOutlineIcon
} from '@mui/icons-material';
import axios from 'axios';

// 테스트 서버 데이터
const mockServers = [
  { id: '1', name: '개발 팀', icon: '🚀', unread: 3 },
  { id: '2', name: '마케팅 팀', icon: '📊', unread: 0 },
  { id: '3', name: '게임 그룹', icon: '🎮', unread: 5 }
];

// 테스트 채널 데이터
const mockChannels = [
  { id: '1', name: '일반', type: 'text', unread: 2 },
  { id: '2', name: '공지사항', type: 'text', unread: 1 },
  { id: '3', name: '질문', type: 'text', unread: 0 },
  { id: '4', name: '음성 채팅 1', type: 'voice', users: ['홍길동', '김철수'] },
  { id: '5', name: '음성 채팅 2', type: 'voice', users: [] }
];

// 테스트 온라인 유저 데이터
const mockOnlineUsers = [
  { id: '1', name: '홍길동', avatar: '🧑', status: 'online' },
  { id: '2', name: '김철수', avatar: '👨', status: 'idle' },
  { id: '3', name: '이영희', avatar: '👩', status: 'dnd' },
  { id: '4', name: '박민수', avatar: '👦', status: 'offline' }
];

// 테스트 메시지 데이터
const mockMessages = [
  {
    id: '1',
    user: { id: '1', name: '홍길동', avatar: '🧑' },
    content: '안녕하세요! 다들 잘 지내시나요?',
    timestamp: '오전 10:15',
  },
  {
    id: '2',
    user: { id: '2', name: '김철수', avatar: '👨' },
    content: '네, 잘 지내고 있습니다. 프로젝트는 어떻게 진행되고 있나요?',
    timestamp: '오전 10:17',
  },
  {
    id: '3',
    user: { id: '3', name: '이영희', avatar: '👩' },
    content: '저희 팀은 일정에 맞춰 진행 중입니다. 다음 주에 중간 보고가 있을 예정이에요.',
    timestamp: '오전 10:20',
  },
  {
    id: '4',
    user: { id: '1', name: '홍길동', avatar: '🧑' },
    content: '좋은 소식이네요! 저희도 일정대로 진행 중입니다.',
    timestamp: '오전 10:25',
  },
  {
    id: '5',
    user: { id: 'system', name: '시스템', avatar: '🤖' },
    content: '김철수님이 서버에 초대되었습니다.',
    isSystem: true,
    timestamp: '오전 11:05',
  }
];

const Discord = () => {
  const theme = useTheme();
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentServer, setCurrentServer] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadDiscordData = async () => {
      setLoading(true);
      try {
        // 실제로는 API 호출로 데이터를 가져오지만 현재는 목업 데이터 사용
        setTimeout(() => {
          setServers(mockServers);
          setChannels(mockChannels);
          setOnlineUsers(mockOnlineUsers);
          setMessages(mockMessages);
          setCurrentServer(mockServers[0]);
          setCurrentChannel({ id: '1', name: '일반', type: 'text' });
          setConnected(true);
          setLoading(false);
        }, 1000);

        /* 실제 API 연동 시 사용할 코드
        const statusRes = await axios.get('/discord/auth-status');
        if (statusRes.data.isAuthenticated) {
          const serversRes = await axios.get('/discord/servers');
          setServers(serversRes.data);
          
          if (serversRes.data.length > 0) {
            setCurrentServer(serversRes.data[0]);
            
            const channelsRes = await axios.get(`/discord/servers/${serversRes.data[0].id}/channels`);
            setChannels(channelsRes.data);
            
            const usersRes = await axios.get(`/discord/servers/${serversRes.data[0].id}/users`);
            setOnlineUsers(usersRes.data);
            
            if (channelsRes.data.length > 0) {
              const textChannel = channelsRes.data.find(c => c.type === 'text') || channelsRes.data[0];
              setCurrentChannel(textChannel);
              
              const messagesRes = await axios.get(`/discord/channels/${textChannel.id}/messages`);
              setMessages(messagesRes.data);
            }
          }
          setConnected(true);
        } else {
          setError('Discord에 연결되어 있지 않습니다. 연결 설정을 확인해주세요.');
        }
        */
      } catch (err) {
        console.error('Discord 데이터 로드 오류:', err);
        setError('Discord 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadDiscordData();
  }, []);

  // Discord 연결 핸들러
  const handleConnect = () => {
    setLoading(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setServers(mockServers);
      setChannels(mockChannels);
      setOnlineUsers(mockOnlineUsers);
      setMessages(mockMessages);
      setCurrentServer(mockServers[0]);
      setCurrentChannel({ id: '1', name: '일반', type: 'text' });
      setConnected(true);
      setLoading(false);
    }, 1000);
  };

  // 서버 변경 핸들러
  const handleChangeServer = (server) => {
    setCurrentServer(server);
    // 실제로는 API 호출로 선택한 서버의 채널 및 유저 정보를 가져옴
  };

  // 채널 변경 핸들러
  const handleChangeChannel = (channel) => {
    setCurrentChannel(channel);
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
    };
    
    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  // 탭 변경 핸들러
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  // 상태에 따른 색상 가져오기
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return theme.palette.success.main;
      case 'idle':
        return theme.palette.warning.main;
      case 'dnd':
        return theme.palette.error.main;
      default:
        return theme.palette.text.disabled;
    }
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
            <DiscordIcon sx={{ fontSize: 72, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" gutterBottom>Discord에 연결되지 않음</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Discord에 연결하여 팀과 소통하세요.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
            >
              Discord 연결하기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      {/* 서버 목록 */}
      <Box
        sx={{
          width: 70,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        {servers.map((server) => (
          <Box 
            key={server.id}
            sx={{
              mb: 1,
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {server.unread > 0 && (
              <Badge
                color="error"
                badgeContent={server.unread}
                sx={{ 
                  position: 'absolute',
                  right: 10,
                  top: 0
                }}
              />
            )}
            <Tooltip title={server.name} placement="right">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: currentServer?.id === server.id ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.7),
                  '&:hover': {
                    bgcolor: theme.palette.primary.main,
                  }
                }}
                onClick={() => handleChangeServer(server)}
              >
                {server.icon}
              </Avatar>
            </Tooltip>
          </Box>
        ))}
        <Tooltip title="서버 추가" placement="right">
          <IconButton
            sx={{
              mt: 2,
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              }
            }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 채널 목록 */}
      <Box
        sx={{
          width: 240,
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {currentServer?.name || '서버'}
          </Typography>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ px: 3, py: 1, fontWeight: 'bold', color: theme.palette.text.secondary, fontSize: '0.75rem' }}
          >
            텍스트 채널
          </Typography>
          <List dense>
            {channels.filter(channel => channel.type === 'text').map((channel) => (
              <ListItem
                key={channel.id}
                button
                selected={currentChannel?.id === channel.id}
                onClick={() => handleChangeChannel(channel)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>#</Typography>
                </ListItemIcon>
                <ListItemText primary={channel.name} />
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
          </List>

          <Typography
            variant="subtitle2"
            sx={{ px: 3, py: 1, mt: 1, fontWeight: 'bold', color: theme.palette.text.secondary, fontSize: '0.75rem' }}
          >
            음성 채널
          </Typography>
          <List dense>
            {channels.filter(channel => channel.type === 'voice').map((channel) => (
              <ListItem
                key={channel.id}
                button
                selected={currentChannel?.id === channel.id}
                onClick={() => handleChangeChannel(channel)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <VolumeUpIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={channel.name} 
                  secondary={channel.users.length > 0 ? `${channel.users.length}명 참여 중` : null}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 사용자 프로필 */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>😎</Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>나</Typography>
            <Typography variant="caption" sx={{ display: 'block', color: theme.palette.success.main }}>온라인</Typography>
          </Box>
          <IconButton size="small" sx={{ mr: 0.5 }}>
            {micMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
          <IconButton size="small">
            {soundMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* 메인 콘텐츠 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 채널 헤더 */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {currentChannel?.type === 'text' ? (
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              # {currentChannel?.name}
            </Typography>
          ) : (
            <Box display="flex" alignItems="center">
              <VolumeUpIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {currentChannel?.name}
              </Typography>
            </Box>
          )}
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {currentChannel?.type === 'text' 
              ? '텍스트 채널에서 메시지를 주고받으세요' 
              : '음성 채널에 참여하여 대화하세요'}
          </Typography>
          <Box flexGrow={1} />
          {currentChannel?.type === 'voice' && (
            <>
              <Tooltip title="화면 공유">
                <IconButton>
                  <ScreenShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="비디오">
                <IconButton>
                  <VideocamIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title="새로고침">
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {/* 메시지 창 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 메시지 목록 */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    ...(message.isSystem ? {
                      justifyContent: 'center',
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      mb: 1,
                    } : {})
                  }}
                >
                  {!message.isSystem && (
                    <Avatar sx={{ mr: 2, width: 40, height: 40 }}>
                      {message.user.avatar}
                    </Avatar>
                  )}
                  <Box>
                    {!message.isSystem && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 'bold', mr: 1 }}>
                          {message.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.timestamp}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* 메시지 입력 */}
            {currentChannel?.type === 'text' && (
              <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                  p: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <TextField
                  fullWidth
                  multiline
                  placeholder={`#${currentChannel?.name || '채널'}에 메시지 보내기`}
                  maxRows={3}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton size="small">
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
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
              </Box>
            )}
          </Box>

          {/* 서버 멤버 목록 */}
          <Box
            sx={{
              width: 240,
              borderLeft: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
            }}
          >
            <Box sx={{ p: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleChangeTab} 
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 'auto',
                  }
                }}
              >
                <Tab 
                  icon={<PeopleIcon />} 
                  iconPosition="start" 
                  label="온라인" 
                />
                <Tab 
                  icon={<PeopleOutlineIcon />} 
                  iconPosition="start" 
                  label="모두" 
                />
              </Tabs>
            </Box>
            
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {onlineUsers.map((user) => (
                <ListItem key={user.id} sx={{ px: 2 }}>
                  <ListItemAvatar>
                    <Box position="relative">
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {user.avatar}
                      </Avatar>
                      <Box 
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: getStatusColor(user.status),
                          border: '2px solid white',
                          position: 'absolute',
                          bottom: 0,
                          right: 0
                        }}
                      />
                    </Box>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={user.name} 
                    primaryTypographyProps={{ 
                      sx: { 
                        fontWeight: user.status === 'online' ? 'bold' : 'normal',
                        color: user.status === 'offline' ? theme.palette.text.disabled : theme.palette.text.primary
                      } 
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Discord; 