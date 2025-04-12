import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 기본 설정값
const defaultSettings = {
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
  },
  services: []
};

export const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 설정 로드
  const loadSettings = async () => {
    setLoading(true);
    try {
      const cachedSettings = localStorage.getItem('userSettings');
      
      if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
      } else {
        const response = await axios.get('/api/settings');
        setSettings(response.data);
        localStorage.setItem('userSettings', JSON.stringify(response.data));
      }
      setError(null);
    } catch (err) {
      console.error('설정을 불러오는 중 오류가 발생했습니다:', err);
      setError('설정을 불러오는 중 오류가 발생했습니다.');
      // 오류 발생 시 기본 설정 사용
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async (newSettings) => {
    setLoading(true);
    try {
      // 서버에 설정 저장
      const response = await axios.post('/api/settings', newSettings);
      
      if (response.data.success) {
        // 로컬 상태와 로컬 스토리지 업데이트
        setSettings(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
        setError(null);
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: '설정 저장에 실패했습니다.' };
      }
    } catch (err) {
      console.error('설정을 저장하는 중 오류가 발생했습니다:', err);
      setError('설정을 저장하는 중 오류가 발생했습니다.');
      return { success: false, error: err.message || '알 수 없는 오류가 발생했습니다.' };
    } finally {
      setLoading(false);
    }
  };

  // 특정 설정만 업데이트
  const updateSettings = async (key, value) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    return await saveSettings(updatedSettings);
  };

  // 테마 전환
  const toggleTheme = async () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    return await updateSettings('theme', newTheme);
  };

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadSettings();
  }, []);

  const contextValue = {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSettings,
    toggleTheme
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider; 