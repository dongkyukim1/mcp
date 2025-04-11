import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          py: 4
        }}
      >
        <Typography variant="h1" color="primary" sx={{ mb: 2, fontSize: { xs: '6rem', sm: '8rem' } }}>
          404
        </Typography>
        <Typography variant="h4" sx={{ mb: 1 }}>
          페이지를 찾을 수 없습니다
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          요청하신 페이지가 존재하지 않거나 다른 주소로 이동했습니다.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          size="large"
        >
          홈으로 돌아가기
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound; 