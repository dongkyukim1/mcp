import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Divider, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  Switch, 
  FormControlLabel, 
  Button, 
  Select, 
  MenuItem, 
  TextField, 
  Slider, 
  Snackbar, 
  Alert, 
  useTheme, 
  alpha, 
  Avatar,
  IconButton,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Tooltip
} from '@mui/material';
import { 
  ColorLens, 
  FormatSize, 
  Visibility, 
  NotificationsActive, 
  VolumeUp, 
  Language, 
  DarkMode, 
  LightMode, 
  Save, 
  Refresh, 
  Check, 
  FormatTextdirection, 
  Palette,
  ArrowBack
} from '@mui/icons-material';

const ClientSettings = () => {
  const theme = useTheme();
  
  // 설정 상태
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'light',
      primaryColor: '#6C5CE7',
      fontSize: 'medium',
      messageDisplay: 'compact',
      animationsEnabled: true
    },
    notifications: {
      sound: true,
      desktop: true,
      mentionsOnly: false,
      soundVolume: 70
    },
    language: {
      interface: 'ko',
      messages: 'ko',
      timeFormat: '24h'
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium'
    }
  });

  // 알림 상태
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 현재 선택된 탭
  const [currentTab, setCurrentTab] = useState(0);
  
  // 저장 중 상태
  const [saving, setSaving] = useState(false);

  // 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem('clientSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // 탭 변경 처리
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // 설정 변경 처리
  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // 설정 저장
  const saveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('clientSettings', JSON.stringify(settings));
      setNotification({
        open: true,
        message: '설정이 저장되었습니다.',
        severity: 'success'
      });
      setSaving(false);
    }, 800);
  };

  // 알림 닫기
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };

  // 컬러 프리셋
  const colorPresets = [
    {name: '보라색', value: '#6C5CE7'},
    {name: '파란색', value: '#3498DB'},
    {name: '녹색', value: '#2ECC71'},
    {name: '빨간색', value: '#E74C3C'},
    {name: '노란색', value: '#F1C40F'},
    {name: '주황색', value: '#FF9800'}
  ];

  // 폰트 크기 옵션
  const fontSizeOptions = [
    {name: '작게', value: 'small'},
    {name: '보통', value: 'medium'},
    {name: '크게', value: 'large'},
    {name: '더 크게', value: 'x-large'}
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton sx={{ mr: 1 }} href="/dashboard">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: settings.appearance.primaryColor }}>
            클라이언트 설정
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="contained" 
            startIcon={saving ? <Refresh /> : <Save />}
            onClick={saveSettings}
            disabled={saving}
            sx={{ 
              bgcolor: settings.appearance.primaryColor, 
              '&:hover': { bgcolor: alpha(settings.appearance.primaryColor, 0.8) }
            }}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          MCP 클라이언트 인터페이스 설정을 관리하세요. 변경사항은 저장 버튼을 클릭해야 적용됩니다.
        </Typography>
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
            '& .Mui-selected': { color: settings.appearance.primaryColor }
          }}
        >
          <Tab icon={<ColorLens />} label="외관" />
          <Tab icon={<NotificationsActive />} label="알림" />
          <Tab icon={<Language />} label="언어 및 포맷" />
          <Tab icon={<Visibility />} label="접근성" />
        </Tabs>

        {/* 외관 설정 탭 */}
        <TabPanel value={currentTab} index={0}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">테마 설정</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.theme === 'dark'}
                      onChange={(e) => handleSettingChange('appearance', 'theme', e.target.checked ? 'dark' : 'light')}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {settings.appearance.theme === 'light' ? <LightMode sx={{ ml: 1 }} /> : <DarkMode sx={{ ml: 1 }} />}
                    </Box>
                  }
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                p: 2, 
                bgcolor: settings.appearance.theme === 'light' ? '#f5f5f5' : '#333',
                color: settings.appearance.theme === 'light' ? '#333' : '#fff',
                borderRadius: 1,
                mb: 3
              }}>
                <Typography>
                  {settings.appearance.theme === 'light' ? '라이트 모드 활성화됨' : '다크 모드 활성화됨'}
                </Typography>
              </Box>
              
              <Typography variant="h6" sx={{ mb: 2 }}>메인 색상</Typography>
              <Grid container spacing={2} mb={3}>
                {colorPresets.map((color) => (
                  <Grid item key={color.value}>
                    <Tooltip title={color.name}>
                      <Box
                        onClick={() => handleSettingChange('appearance', 'primaryColor', color.value)}
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: color.value,
                          cursor: 'pointer',
                          border: settings.appearance.primaryColor === color.value ? '3px solid white' : 'none',
                          boxShadow: settings.appearance.primaryColor === color.value ? '0 0 0 2px #000' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {settings.appearance.primaryColor === color.value && <Check sx={{ color: '#fff' }} />}
                      </Box>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
              
              <Typography variant="h6" sx={{ mb: 2 }}>글자 크기</Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Select
                  value={settings.appearance.fontSize}
                  onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                >
                  {fontSizeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography variant="h6" sx={{ mb: 2 }}>메시지 표시 방식</Typography>
              <FormControl fullWidth>
                <RadioGroup
                  value={settings.appearance.messageDisplay}
                  onChange={(e) => handleSettingChange('appearance', 'messageDisplay', e.target.value)}
                >
                  <FormControlLabel value="cozy" control={<Radio />} label="편안한 모드 (아바타와 메시지를 크게 표시)" />
                  <FormControlLabel value="compact" control={<Radio />} label="간결한 모드 (메시지를 작게 표시하여 더 많은 내용 표시)" />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>애니메이션 설정</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appearance.animationsEnabled}
                    onChange={(e) => handleSettingChange('appearance', 'animationsEnabled', e.target.checked)}
                  />
                }
                label="인터페이스 애니메이션 사용"
              />
              
              <Box sx={{ mt: 2 }}>
                <Typography>애니메이션 예시:</Typography>
                <Box 
                  sx={{ 
                    height: 60, 
                    bgcolor: alpha(settings.appearance.primaryColor, 0.1), 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 1,
                    transition: settings.appearance.animationsEnabled ? 'all 0.3s ease' : 'none',
                    '&:hover': {
                      bgcolor: alpha(settings.appearance.primaryColor, 0.2),
                      transform: settings.appearance.animationsEnabled ? 'scale(1.02)' : 'none'
                    }
                  }}
                >
                  <Typography>애니메이션 요소</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 알림 설정 탭 */}
        <TabPanel value={currentTab} index={1}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>알림 설정</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.desktop}
                    onChange={(e) => handleSettingChange('notifications', 'desktop', e.target.checked)}
                  />
                }
                label="데스크톱 알림 사용"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.sound}
                    onChange={(e) => handleSettingChange('notifications', 'sound', e.target.checked)}
                  />
                }
                label="알림 소리 사용"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.mentionsOnly}
                    onChange={(e) => handleSettingChange('notifications', 'mentionsOnly', e.target.checked)}
                  />
                }
                label="언급된 경우에만 알림 받기"
              />
              
              <Typography sx={{ mt: 2 }}>알림 소리 볼륨</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VolumeUp sx={{ mr: 2 }} />
                <Slider
                  value={settings.notifications.soundVolume}
                  onChange={(e, newValue) => handleSettingChange('notifications', 'soundVolume', newValue)}
                  disabled={!settings.notifications.sound}
                  sx={{ 
                    color: settings.appearance.primaryColor,
                    '& .MuiSlider-thumb': {
                      bgcolor: settings.appearance.primaryColor
                    }
                  }}
                />
                <Typography sx={{ ml: 2, minWidth: 30 }}>
                  {settings.notifications.soundVolume}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>알림 예시</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                p: 2, 
                bgcolor: settings.appearance.theme === 'light' ? '#f5f5f5' : '#333',
                color: settings.appearance.theme === 'light' ? '#333' : '#fff',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}>
                <Avatar sx={{ bgcolor: settings.appearance.primaryColor, mr: 2 }}>홍</Avatar>
                <Box>
                  <Typography variant="subtitle2">홍길동</Typography>
                  <Typography variant="body2">안녕하세요! 새 메시지가 도착했습니다.</Typography>
                </Box>
              </Box>
              
              <Button 
                variant="outlined" 
                onClick={() => {
                  setNotification({
                    open: true,
                    message: '알림 테스트입니다!',
                    severity: 'info'
                  });
                }}
              >
                테스트 알림 보내기
              </Button>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 언어 및 포맷 탭 */}
        <TabPanel value={currentTab} index={2}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>언어 설정</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormLabel>인터페이스 언어</FormLabel>
                <Select
                  value={settings.language.interface}
                  onChange={(e) => handleSettingChange('language', 'interface', e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <MenuItem value="ko">한국어</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormLabel>메시지 표시 언어</FormLabel>
                <Select
                  value={settings.language.messages}
                  onChange={(e) => handleSettingChange('language', 'messages', e.target.value)}
                  sx={{ mt: 1 }}
                >
                  <MenuItem value="ko">한국어</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>시간 및 날짜 포맷</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <FormLabel component="legend">시간 표시 형식</FormLabel>
                <RadioGroup
                  value={settings.language.timeFormat}
                  onChange={(e) => handleSettingChange('language', 'timeFormat', e.target.value)}
                >
                  <FormControlLabel value="12h" control={<Radio />} label="12시간 형식 (오전/오후)" />
                  <FormControlLabel value="24h" control={<Radio />} label="24시간 형식" />
                </RadioGroup>
              </FormControl>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: settings.appearance.theme === 'light' ? '#f5f5f5' : '#333',
                color: settings.appearance.theme === 'light' ? '#333' : '#fff',
                borderRadius: 1,
              }}>
                <Typography>시간 표시 예시:</Typography>
                <Typography sx={{ mt: 1 }}>
                  {settings.language.timeFormat === '12h' ? '오후 2:30' : '14:30'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* 접근성 탭 */}
        <TabPanel value={currentTab} index={3}>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>접근성 설정</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.accessibility.highContrast}
                    onChange={(e) => handleSettingChange('accessibility', 'highContrast', e.target.checked)}
                  />
                }
                label="고대비 모드"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.accessibility.reducedMotion}
                    onChange={(e) => handleSettingChange('accessibility', 'reducedMotion', e.target.checked)}
                  />
                }
                label="모션 감소"
              />
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>글자 크기 조정</Typography>
              <FormControl fullWidth>
                <Select
                  value={settings.accessibility.fontSize}
                  onChange={(e) => handleSettingChange('accessibility', 'fontSize', e.target.value)}
                >
                  <MenuItem value="small">작게</MenuItem>
                  <MenuItem value="medium">보통</MenuItem>
                  <MenuItem value="large">크게</MenuItem>
                  <MenuItem value="x-large">매우 크게</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>미리보기</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                p: 2, 
                bgcolor: settings.appearance.theme === 'light' ? '#f5f5f5' : '#333',
                color: settings.accessibility.highContrast ? '#fff' : (settings.appearance.theme === 'light' ? '#333' : '#fff'),
                borderRadius: 1,
                border: settings.accessibility.highContrast ? `2px solid ${settings.appearance.primaryColor}` : 'none',
              }}>
                <Typography sx={{ 
                  fontSize: 
                    settings.accessibility.fontSize === 'small' ? '0.8rem' : 
                    settings.accessibility.fontSize === 'medium' ? '1rem' : 
                    settings.accessibility.fontSize === 'large' ? '1.2rem' : '1.4rem'
                }}>
                  접근성 설정이 적용된 텍스트 미리보기입니다. 현재 적용된 설정:
                  {settings.accessibility.highContrast && ' 고대비 모드,'}
                  {settings.accessibility.reducedMotion && ' 모션 감소,'}
                  {` 글자 크기: ${
                    settings.accessibility.fontSize === 'small' ? '작게' : 
                    settings.accessibility.fontSize === 'medium' ? '보통' : 
                    settings.accessibility.fontSize === 'large' ? '크게' : '매우 크게'
                  }`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* 알림 스낵바 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

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

export default ClientSettings; 