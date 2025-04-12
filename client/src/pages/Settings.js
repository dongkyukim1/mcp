import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
  Divider, 
  Switch, 
  FormControlLabel, 
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  useTheme,
  alpha,
  FormLabel,
  RadioGroup,
  Radio,
  InputAdornment
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  Sync as SyncIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  GitHub as GitHubIcon,
  Description as NotionIcon,
  Chat as SlackIcon,
  Headset as DiscordIcon,
  Email as GmailIcon,
  Folder as DriveIcon,
  TableChart as SheetsIcon,
  NotificationsActive as PushIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useSettings } from '../contexts/SettingsContext';

// 탭 패널 컴포넌트
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

// 테마 설정 컴포넌트
function ThemeSettings({ currentTheme, onThemeChange }) {
  const theme = useTheme();
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>테마 설정</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Card 
              variant="outlined"
              sx={{ 
                p: 2, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: currentTheme === 'light' ? alpha(theme.palette.primary.main, 0.1) : 'inherit',
                border: currentTheme === 'light' ? `1px solid ${theme.palette.primary.main}` : '1px solid rgba(0, 0, 0, 0.12)',
              }}
              onClick={() => onThemeChange('light')}
            >
              <LightModeIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="subtitle1">라이트 모드</Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card 
              variant="outlined"
              sx={{ 
                p: 2, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                bgcolor: currentTheme === 'dark' ? alpha(theme.palette.primary.main, 0.1) : 'inherit',
                border: currentTheme === 'dark' ? `1px solid ${theme.palette.primary.main}` : '1px solid rgba(0, 0, 0, 0.12)',
              }}
              onClick={() => onThemeChange('dark')}
            >
              <DarkModeIcon sx={{ fontSize: 48, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="subtitle1">다크 모드</Typography>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// 알림 설정 컴포넌트
function NotificationSettings({ settings, onSettingsChange }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>알림 설정</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          <ListItem>
            <ListItemIcon>
              <PushIcon />
            </ListItemIcon>
            <ListItemText 
              primary="푸시 알림 수신" 
              secondary="브라우저 알림을 통해 업데이트 정보를 받습니다" 
            />
            <ListItemSecondaryAction>
              <Switch 
                edge="end" 
                checked={settings?.pushEnabled || false} 
                onChange={(e) => onSettingsChange({...settings, pushEnabled: e.target.checked})}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <GmailIcon />
            </ListItemIcon>
            <ListItemText 
              primary="이메일 알림" 
              secondary="중요 알림을 이메일로 수신합니다" 
            />
            <ListItemSecondaryAction>
              <Switch 
                edge="end" 
                checked={settings?.emailEnabled || false} 
                onChange={(e) => onSettingsChange({...settings, emailEnabled: e.target.checked})}
              />
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 1 }}>
              <InputLabel>알림 빈도</InputLabel>
              <Select
                value={settings?.frequency || 'realtime'}
                onChange={(e) => onSettingsChange({...settings, frequency: e.target.value})}
                label="알림 빈도"
              >
                <MenuItem value="realtime">실시간</MenuItem>
                <MenuItem value="hourly">매시간</MenuItem>
                <MenuItem value="daily">매일</MenuItem>
                <MenuItem value="weekly">매주</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}

// 서비스 연동 설정 컴포넌트
function ServiceSettings({ services, onServiceChange }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>서비스 연동 설정</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          {services.map((service) => (
            <ListItem key={service.id}>
              <ListItemIcon>
                {service.icon}
              </ListItemIcon>
              <ListItemText 
                primary={service.name} 
                secondary={service.connected ? "연결됨" : "연결 필요"} 
              />
              <ListItemSecondaryAction>
                <FormControlLabel
                  control={
                    <Switch 
                      edge="end" 
                      checked={service.enabled} 
                      onChange={(e) => onServiceChange(service.id, { enabled: e.target.checked })}
                    />
                  }
                  label="활성화"
                />
                {service.connected && (
                  <IconButton 
                    edge="end" 
                    color="error"
                    onClick={() => onServiceChange(service.id, { connected: false })}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          fullWidth
        >
          서비스 상태 새로고침
        </Button>
      </CardActions>
    </Card>
  );
}

// 대시보드 설정 컴포넌트
function DashboardSettings({ settings, onSettingsChange }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>대시보드 설정</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings?.showRecentActivities || false}
                  onChange={(e) => onSettingsChange({...settings, showRecentActivities: e.target.checked})}
                />
              }
              label="최근 활동 표시"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={settings?.autoRefresh || false}
                  onChange={(e) => onSettingsChange({...settings, autoRefresh: e.target.checked})}
                />
              }
              label="자동 새로고침 (5분마다)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" size="small" sx={{ mt: 1 }}>
              <InputLabel>레이아웃</InputLabel>
              <Select
                value={settings?.layout || 'grid'}
                onChange={(e) => onSettingsChange({...settings, layout: e.target.value})}
                label="레이아웃"
              >
                <MenuItem value="grid">그리드</MenuItem>
                <MenuItem value="list">리스트</MenuItem>
                <MenuItem value="compact">컴팩트</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function Settings() {
  const { settings, loading, error, saveSettings, toggleTheme } = useSettings();
  const [currentTab, setCurrentTab] = useState(0);
  const [localSettings, setLocalSettings] = useState({
    theme: 'light',
    notifications: {
      pushEnabled: true,
      emailEnabled: false,
      frequency: 'realtime'
    },
    dashboard: {
      showRecentActivities: true,
      autoRefresh: false,
      layout: 'grid'
    }
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // settings가 로드되면 localSettings 업데이트
  useEffect(() => {
    if (settings && !loading) {
      setLocalSettings(settings);
    }
  }, [settings, loading]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // 설정 변경 핸들러
  const handleSettingChange = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // 테마 변경 핸들러
  const handleThemeChange = () => {
    setLocalSettings(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  // 설정 저장 핸들러
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const result = await saveSettings(localSettings);
      
      if (result.success) {
        setNotification({
          open: true,
          message: '설정이 성공적으로 저장되었습니다.',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: `설정 저장 실패: ${result.error}`,
          severity: 'error'
        });
      }
    } catch (err) {
      setNotification({
        open: true,
        message: '설정 저장 중 오류가 발생했습니다.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // 알림 닫기 핸들러
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#6C5CE7' }}>
          설정
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          애플리케이션의 설정을 관리하세요. 변경사항은 저장 버튼을 클릭해야 적용됩니다.
        </Typography>
        
        {/* 설정 저장 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="contained" 
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
            sx={{ 
              bgcolor: '#6C5CE7', 
              '&:hover': { bgcolor: '#5D4ED9' }
            }}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 'bold' },
            '& .Mui-selected': { color: '#6C5CE7' }
          }}
        >
          <Tab icon={<DarkModeIcon />} label="테마" />
          <Tab icon={<NotificationsIcon />} label="알림 설정" />
          <Tab icon={<DashboardIcon />} label="대시보드 설정" />
        </Tabs>

        {/* 테마 설정 탭 */}
        <TabPanel value={currentTab} index={0}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    {localSettings.theme === 'light' ? 
                      <LightModeIcon sx={{ mr: 2, color: '#FF9800' }} /> : 
                      <DarkModeIcon sx={{ mr: 2, color: '#6C5CE7' }} />
                    }
                    <Typography variant="h6">
                      {localSettings.theme === 'light' ? '라이트 모드' : '다크 모드'}
                    </Typography>
                  </Box>
                  <Switch
                    checked={localSettings.theme === 'dark'}
                    onChange={handleThemeChange}
                    color="primary"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            테마 미리보기
          </Typography>
          
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: localSettings.theme === 'light' ? '#fff' : '#2D3436',
              color: localSettings.theme === 'light' ? '#2D3436' : '#fff',
              borderRadius: 2,
              border: '1px solid',
              borderColor: localSettings.theme === 'light' ? '#E2E8F0' : '#4D5456',
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              {localSettings.theme === 'light' ? '라이트 모드 미리보기' : '다크 모드 미리보기'}
            </Typography>
            <Box 
              sx={{ 
                bgcolor: localSettings.theme === 'light' ? '#6C5CE7' : '#5D4ED9',
                color: '#fff',
                px: 3,
                py: 1,
                borderRadius: 1
              }}
            >
              샘플 버튼
            </Box>
          </Box>
        </TabPanel>

        {/* 알림 설정 탭 */}
        <TabPanel value={currentTab} index={1}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                알림 수신 방법
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings?.notifications?.pushEnabled || false}
                        onChange={(e) => handleSettingChange('notifications', 'pushEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center">
                        <PushIcon sx={{ mr: 1, color: '#6C5CE7' }} />
                        <Typography>푸시 알림</Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings?.notifications?.emailEnabled || false}
                        onChange={(e) => handleSettingChange('notifications', 'emailEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box display="flex" alignItems="center">
                        <GmailIcon sx={{ mr: 1, color: '#00CEC9' }} />
                        <Typography>이메일 알림</Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                알림 빈도 설정
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={localSettings?.notifications?.frequency || 'realtime'}
                  onChange={(e) => handleSettingChange('notifications', 'frequency', e.target.value)}
                >
                  <FormControlLabel value="realtime" control={<Radio color="primary" />} label="실시간 알림" />
                  <FormControlLabel value="hourly" control={<Radio color="primary" />} label="시간별 요약" />
                  <FormControlLabel value="daily" control={<Radio color="primary" />} label="일일 요약" />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 대시보드 설정 탭 */}
        <TabPanel value={currentTab} index={2}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                대시보드 표시 설정
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings?.dashboard?.showRecentActivities || false}
                        onChange={(e) => handleSettingChange('dashboard', 'showRecentActivities', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="최근 활동 표시"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localSettings?.dashboard?.autoRefresh || false}
                        onChange={(e) => handleSettingChange('dashboard', 'autoRefresh', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="자동 새로고침 (5분마다)"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                대시보드 레이아웃
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Select
                  value={localSettings?.dashboard?.layout || 'grid'}
                  onChange={(e) => handleSettingChange('dashboard', 'layout', e.target.value)}
                >
                  <MenuItem value="grid">그리드 레이아웃</MenuItem>
                  <MenuItem value="list">리스트 레이아웃</MenuItem>
                  <MenuItem value="compact">컴팩트 레이아웃</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 100
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {localSettings?.dashboard?.layout === 'grid' && '그리드 레이아웃 미리보기'}
                  {localSettings?.dashboard?.layout === 'list' && '리스트 레이아웃 미리보기'}
                  {localSettings?.dashboard?.layout === 'compact' && '컴팩트 레이아웃 미리보기'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* 알림 스낵바 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Settings;
