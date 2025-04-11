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
  Paper, 
  CircularProgress, 
  Avatar, 
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  IconButton,
  alpha
} from '@mui/material';
import { 
  TableChart as SheetIcon, 
  Add as AddIcon, 
  Link as LinkIcon,
  Refresh as RefreshIcon,
  EventNote as SpreadsheetIcon,
  CalendarViewMonth as GridViewIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import axios from 'axios';

// 테스트 시트 데이터
const mockSheets = [
  { 
    id: '1', 
    title: '분기별 매출 보고서', 
    owner: 'me', 
    modified: '2023-05-15', 
    shared: true, 
    starred: true,
    lastEdit: '어제'
  },
  { 
    id: '2', 
    title: '프로젝트 일정 관리', 
    owner: 'me', 
    modified: '2023-05-12', 
    shared: true, 
    starred: false,
    lastEdit: '2일 전'
  },
  { 
    id: '3', 
    title: '인력 계획', 
    owner: 'me', 
    modified: '2023-05-10', 
    shared: false, 
    starred: false,
    lastEdit: '1주일 전'
  },
  { 
    id: '4', 
    title: '마케팅 예산', 
    owner: 'me', 
    modified: '2023-05-01', 
    shared: true, 
    starred: true,
    lastEdit: '2주일 전'
  },
  { 
    id: '5', 
    title: '제품 재고 관리', 
    owner: 'me', 
    modified: '2023-04-28', 
    shared: false, 
    starred: false,
    lastEdit: '3주일 전'
  }
];

// 최근 활동 스프레드시트 데이터
const mockRecentSheets = [
  { id: '1', title: '분기별 매출 보고서', lastEdit: '어제' },
  { id: '2', title: '프로젝트 일정 관리', lastEdit: '2일 전' },
  { id: '3', title: '인력 계획', lastEdit: '1주일 전' }
];

const Sheets = () => {
  const theme = useTheme();
  const [sheets, setSheets] = useState([]);
  const [recentSheets, setRecentSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // 시트 데이터 로드
  useEffect(() => {
    const loadSheetsData = async () => {
      setLoading(true);
      try {
        // 실제로는 API 호출로 데이터를 가져오지만 현재는 목업 데이터 사용
        setTimeout(() => {
          setSheets(mockSheets);
          setRecentSheets(mockRecentSheets);
          setConnected(true);
          setLoading(false);
        }, 1000);

        /* 실제 API 연동 시 사용할 코드
        const statusRes = await axios.get('/sheets/auth-status');
        if (statusRes.data.isAuthenticated) {
          const sheetsRes = await axios.get('/sheets/list');
          const recentRes = await axios.get('/sheets/recent');
          
          setSheets(sheetsRes.data);
          setRecentSheets(recentRes.data);
          setConnected(true);
        } else {
          setError('Google Sheets에 연결되어 있지 않습니다. 연결 설정을 확인해주세요.');
        }
        */
      } catch (err) {
        console.error('시트 데이터 로드 오류:', err);
        setError('시트 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSheetsData();
  }, []);

  // Sheets 연결 핸들러
  const handleConnect = () => {
    setLoading(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setConnected(true);
      setLoading(false);
    }, 1000);
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    setLoading(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // 즐겨찾기 토글 핸들러
  const handleToggleStar = (id) => {
    setSheets(sheets.map(sheet => 
      sheet.id === id 
        ? { ...sheet, starred: !sheet.starred } 
        : sheet
    ));
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
            <SheetIcon sx={{ fontSize: 72, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" gutterBottom>Google Sheets에 연결되지 않음</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Google Sheets에 연결하여 스프레드시트를 관리할 수 있습니다.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
            >
              Sheets 연결하기
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Google Sheets
        </Typography>
        <Box>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            새 스프레드시트
          </Button>
        </Box>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>최근 스프레드시트</Typography>
      
      {recentSheets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <Typography color="text.secondary">최근 편집한 스프레드시트가 없습니다.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {recentSheets.map(sheet => (
            <Grid item xs={12} sm={6} md={4} key={sheet.id}>
              <Card sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.success.light, mr: 2 }}>
                      <SpreadsheetIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {sheet.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        마지막 편집: {sheet.lastEdit}
                      </Typography>
                    </Box>
                    <Box ml="auto">
                      <IconButton>
                        <ArrowRightIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>내 스프레드시트</Typography>
      
      {sheets.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">스프레드시트가 없습니다.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell width="5%"></TableCell>
                <TableCell width="50%">제목</TableCell>
                <TableCell width="15%">최근 수정</TableCell>
                <TableCell width="15%">공유 상태</TableCell>
                <TableCell width="15%">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow key={sheet.id} hover>
                  <TableCell padding="checkbox">
                    <IconButton size="small" onClick={() => handleToggleStar(sheet.id)}>
                      {sheet.starred ? 
                        <StarIcon sx={{ color: theme.palette.warning.main }} /> : 
                        <StarBorderIcon sx={{ color: theme.palette.text.secondary }} />
                      }
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <GridViewIcon sx={{ mr: 1, color: theme.palette.success.main }} />
                      <Typography>{sheet.title}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{sheet.lastEdit}</TableCell>
                  <TableCell>
                    {sheet.shared ? (
                      <Box display="flex" alignItems="center">
                        <ShareIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.info.main }} />
                        <Typography variant="body2">공유됨</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">비공개</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">열기</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default Sheets; 