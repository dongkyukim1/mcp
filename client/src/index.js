import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// axios 기본 설정
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

// 개발 환경에서 요청 디버깅
axios.interceptors.request.use(request => {
  console.log('Axios 요청:', request.method, request.url);
  return request;
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 