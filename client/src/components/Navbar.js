import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Logout,
  Settings,
  AccountCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleDarkMode, darkMode, toggleSidebar, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // 현재 사용자 정보
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };
  
  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          MCP - 관리 제어 패널
        </Typography>
        
        <Box display="flex" alignItems="center">
          <Tooltip title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Box ml={2}>
            <Tooltip title="계정 메뉴">
              <IconButton
                size="large"
                aria-label="account"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }} alt={user.name || 'User'}>
                  {(user.name && user.name[0]) || <AccountCircle />}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body1">{user.name || '사용자'}</Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">{user.email || 'user@example.com'}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleSettings}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                설정
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                로그아웃
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 