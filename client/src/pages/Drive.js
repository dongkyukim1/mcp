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

const Drive = () => {
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // 드라이브 데이터 로드
  useEffect(() => {
    // URL 파라미터 확인 (인증 콜백 처리)
    const searchParams = new URLSearchParams(window.location.search);
    const authStatus = searchParams.get('auth');
    
    if (authStatus) {
      console.log("인증 파라미터 감지, URL 정리");
      window.history.replaceState({}, document.title, '/drive');
      
      if (authStatus === 'error') {
        setError("Google Drive 인증에 실패했습니다.");
      }
    }
    
    // 로딩 상태 설정
    setLoading(true);
    
    // 인증 상태 확인
    const checkAuthStatus = async () => {
      try {
        console.log("드라이브 인증 상태 확인 중...");
        const response = await axios.get('/api/drive/auth-status');
        console.log("드라이브 인증 상태:", response.data);
        
        if (response.data.isAuthenticated) {
          // 인증된 경우 실제 데이터 로드
          try {
            console.log("드라이브 파일/폴더 데이터 로드 중...");
            const [filesRes, foldersRes] = await Promise.all([
              axios.get('/api/drive/files'),
              axios.get('/api/drive/folders')
            ]);
            
            setFiles(filesRes.data);
            setFolders(foldersRes.data);
            setConnected(true);
            setError(null);
          } catch (dataErr) {
            console.error("드라이브 데이터 로드 오류:", dataErr);
            setError("드라이브 데이터를 불러오는 중 오류가 발생했습니다.");
            setFiles([]);
            setFolders([]);
          }
        } else {
          // 인증되지 않은 경우
          setConnected(false);
          setFiles([]);
          setFolders([]);
        }
      } catch (err) {
        console.error("드라이브 인증 상태 확인 오류:", err);
        setConnected(false);
        setError("드라이브 연결 상태 확인 중 오류가 발생했습니다.");
        setFiles([]);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    };
    
    // 인증 상태 확인 실행 (단 한 번만)
    checkAuthStatus();
  }, []); // 빈 의존성 배열 - 마운트 시 한 번만 실행

  // 드라이브 연결 핸들러
  const handleConnect = () => {
    console.log("Google Drive 인증 페이지로 이동");
    window.location.href = '/api/drive/auth';
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    console.log("드라이브 데이터 새로고침");
    setLoading(true);
    
    try {
      const [filesRes, foldersRes] = await Promise.all([
        axios.get('/api/drive/files'),
        axios.get('/api/drive/folders')
      ]);
      
      setFiles(filesRes.data);
      setFolders(foldersRes.data);
      setError(null);
    } catch (err) {
      console.error("새로고침 오류:", err);
      setError("데이터 새로고침 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 파일 클릭 핸들러 추가
  const handleFileClick = async (fileId) => {
    try {
      console.log(`파일 열기 요청: ${fileId}`);
      const response = await axios.get(`/api/drive/files/${fileId}/view`);
      
      if (response.data.viewUrl) {
        // 새 탭에서 파일 열기
        window.open(response.data.viewUrl, '_blank');
      }
    } catch (err) {
      console.error('파일 열기 오류:', err);
      setError('파일을 여는 중 오류가 발생했습니다');
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
                <ListItem button onClick={() => handleFileClick(file.id)}>
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