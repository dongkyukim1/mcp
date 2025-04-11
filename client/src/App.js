import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// 레이아웃 및 페이지 컴포넌트 가져오기
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Gmail from './pages/Gmail';
import GitHub from './pages/GitHub';
import Notion from './pages/Notion';
import Figma from './pages/Figma';
import Drive from './pages/Drive';
import Sheets from './pages/Sheets';
import Slack from './pages/Slack';
import Discord from './pages/Discord';
import NotFound from './pages/NotFound';

// 테마 설정
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6C5CE7', // 보라색 계열의 메인 색상
      light: '#A29BFE',
      dark: '#5541D7',
    },
    secondary: {
      main: '#00CEC9', // 민트 계열의 보조 색상
      light: '#81ECEC',
      dark: '#00A8A3',
    },
    background: {
      default: '#F7F8FC', // 연한 회색 배경
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
    divider: '#E0E4EC',
    error: {
      main: '#FF7675',
    },
    warning: {
      main: '#FDCB6E',
    },
    info: {
      main: '#74B9FF',
    },
    success: {
      main: '#55EFC4',
    },
  },
  typography: {
    fontFamily: [
      'Pretendard',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 10px rgba(108, 92, 231, 0.2)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 10px rgba(108, 92, 231, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&.Mui-selected': {
            backgroundColor: 'rgba(108, 92, 231, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(108, 92, 231, 0.16)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '1px 0 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 5px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.02)',
    '0 3px 8px rgba(0, 0, 0, 0.04)',
    '0 4px 12px rgba(0, 0, 0, 0.06)',
    '0 5px 14px rgba(0, 0, 0, 0.08)',
    '0 6px 16px rgba(0, 0, 0, 0.1)',
    '0 7px 18px rgba(0, 0, 0, 0.12)',
    '0 8px 20px rgba(0, 0, 0, 0.14)',
    '0 9px 22px rgba(0, 0, 0, 0.16)',
    '0 10px 24px rgba(0, 0, 0, 0.18)',
    '0 11px 26px rgba(0, 0, 0, 0.2)',
    '0 12px 28px rgba(0, 0, 0, 0.22)',
    '0 13px 30px rgba(0, 0, 0, 0.24)',
    '0 14px 32px rgba(0, 0, 0, 0.26)',
    '0 15px 34px rgba(0, 0, 0, 0.28)',
    '0 16px 36px rgba(0, 0, 0, 0.3)',
    '0 17px 38px rgba(0, 0, 0, 0.32)',
    '0 18px 40px rgba(0, 0, 0, 0.34)',
    '0 19px 42px rgba(0, 0, 0, 0.36)',
    '0 20px 44px rgba(0, 0, 0, 0.38)',
    '0 21px 46px rgba(0, 0, 0, 0.4)',
    '0 22px 48px rgba(0, 0, 0, 0.42)',
    '0 23px 50px rgba(0, 0, 0, 0.44)',
    '0 24px 52px rgba(0, 0, 0, 0.46)',
    '0 25px 54px rgba(0, 0, 0, 0.48)'
  ],
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gmail" element={<Gmail />} />
            <Route path="/github" element={<GitHub />} />
            <Route path="/notion" element={<Notion />} />
            <Route path="/figma" element={<Figma />} />
            <Route path="/drive" element={<Drive />} />
            <Route path="/sheets" element={<Sheets />} />
            <Route path="/slack" element={<Slack />} />
            <Route path="/discord" element={<Discord />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App; 