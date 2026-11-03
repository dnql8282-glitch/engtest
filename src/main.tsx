import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from './core/storage';
import { userStore } from './core/userStore';
import { localStorageStore } from './web/platform/localStorageStore';
import './index.css';
import App from './App.tsx';

// 1) 플랫폼 연결: core에게 "웹에서는 localStorage에 저장해"라고 알려줘요.
configureStore(localStorageStore);
// 2) 저장된 사용자 데이터(구독, 좋아요)를 불러오기 시작해요.
void userStore.init();

// BrowserRouter: 주소창의 경로(/watch/v1 등)를 읽어서 앱 안에서 쓸 수 있게 해줘요.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
