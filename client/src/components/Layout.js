import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Avatar,
  Tooltip,
  useTheme,
  useMediaQuery,
  Badge,
  InputBase,
  Paper,
  alpha,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Email as GmailIcon,
  GitHub as GitHubIcon,
  Description as NotionIcon,
  Brush as FigmaIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Folder as FolderIcon,
  TableChart as TableChartIcon,
  Chat as ChatIcon,
  Headset as HeadsetIcon,
  AccountCircle as AccountCircleIcon,
  ColorLens as ColorLensIcon,
} from '@mui/icons-material';
import axios from 'axios';

// 사이드바 너비
const drawerWidth = 250;

// 사이드바 메뉴 항목 데이터
const menuItemsData = [
  { 
    id: 'dashboard',
    text: '대시보드', 
    path: '/', 
    icon: <DashboardIcon />
  },
  {
    id: 'gmail',
    text: 'Gmail',
    path: '/gmail',
    icon: <GmailIcon />,
    notificationEndpoint: '/api/gmail/notifications/count'
  },
  {
    id: 'github',
    text: 'GitHub',
    path: '/github',
    icon: <GitHubIcon />,
    notificationEndpoint: '/api/github/notifications/count'
  },
  {
    id: 'notion',
    text: '노션',
    path: '/notion',
    icon: <NotionIcon />,
    notificationEndpoint: '/api/notion/notifications/count'
  },
  {
    id: 'figma',
    text: '피그마',
    path: '/figma',
    icon: <FigmaIcon />
  },
  {
    id: 'drive',
    text: '드라이브',
    path: '/drive',
    icon: <FolderIcon />
  },
  {
    id: 'sheets',
    text: '시트',
    path: '/sheets',
    icon: <TableChartIcon />
  },
  {
    id: 'slack',
    text: '슬랙',
    path: '/slack',
    icon: <ChatIcon />,
    notificationEndpoint: '/api/slack/notifications/count'
  },
  {
    id: 'discord',
    text: '디스코드',
    path: '/discord',
    icon: <HeadsetIcon />,
    notificationEndpoint: '/api/discord/notifications/count'
  }
];

// 사용자 메뉴 항목 데이터
const userMenuItems = [
  {
    title: '설정',
    path: '/settings',
    icon: <SettingsIcon />
  },
  {
    title: '클라이언트 설정',
    path: '/client-settings',
    icon: <ColorLensIcon />
  },
  {
    title: '로그아웃',
    path: '/logout',
    icon: <LogoutIcon />
  }
];

// 공통 레이아웃 컴포넌트
const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(menuItemsData);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loading, setLoading] = useState(false);

  // 사용자 메뉴 상태 추가
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  // 사용자 메뉴 열기 핸들러
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // 사용자 메뉴 닫기 핸들러
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // 설정 페이지로 이동
  const handleOpenSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    handleMenuClose();
    // 로그아웃 로직 구현
    alert('로그아웃 기능은 아직 구현되지 않았습니다.');
  };

  // 알림 카운트 가져오기
  useEffect(() => {
    const fetchNotificationCounts = async () => {
      try {
        // 알림 엔드포인트가 있는 메뉴 항목만 필터링
        const itemsWithNotifications = menuItems.filter(item => item.notificationEndpoint);
        
        // 각 서비스별 알림 카운트 요청 (병렬 처리)
        const notificationPromises = itemsWithNotifications.map(async (item) => {
          try {
            // API 요청으로 알림 카운트 가져오기
            const response = await axios.get(item.notificationEndpoint, { timeout: 3000 });
            return {
              id: item.id,
              count: response.data.count || 0
            };
          } catch (error) {
            console.error(`${item.text} 알림 조회 실패:`, error);
            
            // 개발 환경에서는 임시 데이터 사용
            if (process.env.NODE_ENV === 'development') {
              // 테스트 데이터: Gmail은 3개, GitHub은 2개의 알림
              const devNotifications = {
                'gmail': 3,
                'github': 2,
                'notion': 0
              };
              return {
                id: item.id,
                count: devNotifications[item.id] || 0
              };
            }
            
            return { id: item.id, count: 0 };
          }
        });
        
        // 알림 카운트 결과 처리
        const notificationResults = await Promise.all(notificationPromises);
        
        // 알림 카운트를 메뉴 항목에 적용
        const updatedMenuItems = menuItems.map(item => {
          const notification = notificationResults.find(n => n.id === item.id);
          return {
            ...item,
            notificationCount: notification ? notification.count : 0
          };
        });
        
        // 총 알림 수 계산
        const total = notificationResults.reduce((sum, item) => sum + item.count, 0);
        
        setMenuItems(updatedMenuItems);
        setTotalNotifications(total);
        
      } catch (error) {
        console.error('알림 카운트 로드 오류:', error);
      }
    };
    
    fetchNotificationCounts();
    
    // 주기적으로 알림 카운트 업데이트 (5분 간격)
    const intervalId = setInterval(fetchNotificationCounts, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // 현재 활성화된 메뉴 항목 확인
  const isActiveRoute = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // 메뉴 항목 클릭 핸들러
  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // 모바일 메뉴 토글 핸들러
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 현재 페이지 제목 가져오기
  const getPageTitle = () => {
    if (location.pathname === '/') return '대시보드'; 
    if (location.pathname.startsWith('/gmail')) return 'Gmail';
    if (location.pathname.startsWith('/github')) return 'GitHub';
    if (location.pathname.startsWith('/notion')) return '노션';
    if (location.pathname.startsWith('/figma')) return '피그마';
    return '';
  };

  // 네비게이션 메뉴 렌더링
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center">
          <Typography
            variant="h5"
            component="div"
            fontWeight="bold"
            color="primary.main"
            sx={{ letterSpacing: '0.5px' }}
          >
            MCP
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider variant="middle" sx={{ mb: 2 }} />
      
      <Box sx={{ px: 2, mb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: alpha(theme.palette.primary.light, 0.1),
          }}
        >
          <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
          <InputBase
            placeholder="검색..."
            fullWidth
            sx={{ fontSize: '0.9rem' }}
          />
        </Paper>
      </Box>
      
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ px: 3, mb: 1, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}
      >
        메인 메뉴
      </Typography>
      
      <List component="nav" sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              selected={isActiveRoute(item.path)}
              sx={{
                py: 1.2,
                borderRadius: `${theme.shape.borderRadius}px`,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  }
                },
                '&:hover': {
                  backgroundColor: isActiveRoute(item.path) 
                    ? theme.palette.primary.dark 
                    : alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <ListItemIcon sx={{
                color: isActiveRoute(item.path) ? 'white' : theme.palette.text.secondary,
                minWidth: 38,
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.notificationCount > 0 && (
                <Badge 
                  color="error" 
                  badgeContent={item.notificationCount} 
                  sx={{ 
                    ml: 1,
                    '& .MuiBadge-badge': {
                      animation: item.id === 'gmail' ? 'pulse 2s infinite' : 'none'
                    }
                  }} 
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider variant="middle" sx={{ my: 3 }} />
      
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ px: 3, mb: 1, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}
      >
        계정
      </Typography>
      
      <List sx={{ px: 2, mt: 'auto' }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => navigate('/settings')}
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              py: 1.2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: theme.palette.text.secondary }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="설정" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => navigate('/client-settings')}
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              py: 1.2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: theme.palette.text.secondary }}>
              <ColorLensIcon />
            </ListItemIcon>
            <ListItemText primary="클라이언트 설정" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              borderRadius: `${theme.shape.borderRadius}px`,
              py: 1.2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: theme.palette.error.main }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="로그아웃" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ mt: 'auto', mb: 2, mx: 3, p: 2, borderRadius: theme.shape.borderRadius, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: theme.palette.primary.main }}>U</Avatar>
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>사용자 이름</Typography>
            <Typography variant="caption" color="text.secondary">user@example.com</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // 사용자 메뉴 렌더링
  const renderUserMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleOpenSettings}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        설정
      </MenuItem>
      <MenuItem onClick={() => { handleMenuClose(); navigate('/client-settings'); }}>
        <ListItemIcon>
          <ColorLensIcon fontSize="small" />
        </ListItemIcon>
        클라이언트 설정
      </MenuItem>
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        로그아웃
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              fontWeight="medium"
              color="text.primary"
            >
              {getPageTitle()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* 알림 아이콘 */}
            <Tooltip title="알림">
              <IconButton color="inherit">
                <Badge badgeContent={totalNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* 설정 버튼 */}
            <Tooltip title="설정">
              <IconButton
                color="inherit"
                onClick={() => navigate('/settings')}
                sx={{ mx: 1 }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            {/* 사용자 아이콘 */}
            <Tooltip title="내 프로필">
              <IconButton
                edge="end"
                aria-label="사용자 계정"
                aria-controls="user-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* 사용자 메뉴 */}
      {renderUserMenu}
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* 모바일 드로어 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 모바일 성능 향상
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* 데스크톱 드로어 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          py: 3,
          px: { xs: 2, md: 4 },
        }}
      >
        <Toolbar /> {/* 앱바 높이만큼 여백 */}
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 