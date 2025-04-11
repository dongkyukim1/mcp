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
  useTheme,
  IconButton
} from '@mui/material';
import { 
  Folder as FolderIcon, 
  Description as FileIcon, 
  CloudUpload as UploadIcon, 
  CreateNewFolder as NewFolderIcon, 
  Link as LinkIcon,
  Refresh as RefreshIcon,
  InsertDriveFile as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Movie as VideoIcon,
  AudioFile as AudioIcon,
} from '@mui/icons-material';
import axios from 'axios';

// 파일 유형에 따른 아이콘 가져오기
const getFileIcon = (fileType) => {
  switch(fileType) {
    case 'document':
      return <DocumentIcon />;
    case 'image':
      return <ImageIcon />;
    case 'pdf':
      return <PdfIcon />;
    case 'video':
      return <VideoIcon />;
    case 'audio':
      return <AudioIcon />;
    default:
      return <FileIcon />;
  }
};

// 테스트 파일 데이터
const mockFiles = [
  { 
    id: '1', 
    name: '회의록.docx', 
    type: 'document', 
    size: '512KB', 
    modified: '2023-05-10', 
    owner: 'me', 
    shared: false 
  },
  { 
    id: '2', 
    name: '프로젝트 계획서.pdf', 
    type: 'pdf', 
    size: '1.2MB', 
    modified: '2023-05-12', 
    owner: 'me', 
    shared: true 
  },
  { 
    id: '3', 
    name: '프레젠테이션.pptx', 
    type: 'document', 
    size: '3.5MB', 
    modified: '2023-05-15', 
    owner: 'me', 
    shared: false 
  },
  { 
    id: '4', 
    name: '디자인 에셋', 
    type: 'folder', 
    items: 12, 
    modified: '2023-05-08', 
    owner: 'me', 
    shared: true 
  },
  { 
    id: '5', 
    name: '제품 사진.jpg', 
    type: 'image', 
    size: '2.4MB', 
    modified: '2023-05-20', 
    owner: 'me', 
    shared: false 
  }
];

// 테스트 폴더 데이터
const mockFolders = [
  { id: '1', name: '프로젝트', items: 8, modified: '2023-05-18', shared: true },
  { id: '2', name: '문서', items: 15, modified: '2023-05-15', shared: false },
  { id: '3', name: '이미지', items: 32, modified: '2023-05-10', shared: false }
];

const Drive = () => {
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // 드라이브 데이터 로드
  useEffect(() => {
    const loadDriveData = async () => {
      setLoading(true);
      try {
        // 인증 상태 확인
        const statusRes = await axios.get('/api/drive/auth-status');
        
        if (statusRes.data.isAuthenticated) {
          // 파일 및 폴더 목록 가져오기
          const [filesRes, foldersRes] = await Promise.all([
            axios.get('/api/drive/files'),
            axios.get('/api/drive/folders')
          ]);
          
          setFiles(filesRes.data);
          setFolders(foldersRes.data);
          setConnected(true);
        } else {
          setConnected(false);
          if (statusRes.data.reason === 'token_expired') {
            setError('Google Drive 토큰이 만료되었습니다. 다시 연결해주세요.');
          }
        }
      } catch (err) {
        console.error('드라이브 데이터 로드 오류:', err);
        setError('드라이브 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    // 연결된 상태일 때만 데이터 로드
    if (connected) {
      loadDriveData();
    }
  }, [connected]);

  // 드라이브 연결 핸들러
  const handleConnect = async () => {
    setLoading(true);
    try {
      // API 인증 URL 가져오기
      const response = await axios.get('/api/drive/auth');
      
      if (response.data && response.data.authUrl) {
        // 인증 URL로 사용자 리디렉션
        window.location.href = response.data.authUrl;
      } else {
        throw new Error('인증 URL을 가져오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('드라이브 연결 오류:', err);
      setError('Google Drive 연결 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // URL 파라미터 체크 (인증 콜백 처리)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authStatus = searchParams.get('auth');
    
    if (authStatus === 'success') {
      // 인증 성공 시 상태 업데이트 및 URL 파라미터 제거
      setConnected(true);
      window.history.replaceState({}, document.title, '/drive');
      
      // loadDriveData 함수를 직접 호출하지 않고, connected 상태만 업데이트
      // useEffect의 의존성 배열에 connected가 있으므로 loadDriveData가 자동으로 실행됨
    } else if (authStatus === 'error') {
      setError('Google Drive 인증에 실패했습니다. 다시 시도해주세요.');
      window.history.replaceState({}, document.title, '/drive');
    }
  }, []);

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // 인증 상태 확인
      const statusRes = await axios.get('/api/drive/auth-status');
      
      if (statusRes.data.isAuthenticated) {
        // 파일 및 폴더 목록 새로 가져오기
        const [filesRes, foldersRes] = await Promise.all([
          axios.get('/api/drive/files'),
          axios.get('/api/drive/folders')
        ]);
        
        setFiles(filesRes.data);
        setFolders(foldersRes.data);
        setError(null); // 이전 오류 메시지 제거
      } else {
        setConnected(false);
        setError('Google Drive에 연결되어 있지 않습니다. 다시 연결해주세요.');
      }
    } catch (err) {
      console.error('드라이브 데이터 새로고침 오류:', err);
      setError('드라이브 데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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
            <FolderIcon sx={{ fontSize: 72, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" gutterBottom>Google Drive에 연결되지 않음</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Google Drive에 연결하여 파일과 폴더를 관리할 수 있습니다.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<LinkIcon />}
              onClick={handleConnect}
            >
              Drive 연결하기
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
          Google Drive
        </Typography>
        <Box>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="outlined" 
            startIcon={<NewFolderIcon />}
            sx={{ mr: 1 }}
          >
            새 폴더
          </Button>
          <Button 
            variant="contained" 
            startIcon={<UploadIcon />}
          >
            파일 업로드
          </Button>
        </Box>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>폴더</Typography>
      
      {folders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <Typography color="text.secondary">폴더가 없습니다.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {folders.map(folder => (
            <Grid item xs={12} sm={6} md={4} key={folder.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: theme.palette.primary.light, mr: 2 }}>
                      <FolderIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {folder.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {folder.items}개 항목 • {folder.modified}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>파일</Typography>
      
      {files.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">파일이 없습니다.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <List sx={{ width: '100%' }}>
            {files.map((file, index) => (
              <React.Fragment key={file.id}>
                <ListItem button>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: file.type === 'folder' ? theme.palette.primary.light : theme.palette.secondary.light }}>
                      {file.type === 'folder' ? <FolderIcon /> : getFileIcon(file.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={file.name} 
                    secondary={
                      file.type === 'folder' 
                        ? `${file.items}개 항목 • ${file.modified}`
                        : `${file.size} • ${file.modified}`
                    } 
                  />
                </ListItem>
                {index < files.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default Drive; 