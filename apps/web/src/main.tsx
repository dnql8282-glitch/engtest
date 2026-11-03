import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@mytube/core/storage';
import { accountStore } from '@mytube/core/accountStore';
import { localStorageStore } from './platform/localStorageStore';
import './index.css';
import App from './App.tsx';

// 1) 플랫폼 연결: core에게 "웹에서는 localStorage에 저장해"라고 알려줘요.
configureStore(localStorageStore);
// 2) 마지막 로그인 계정을 불러오고, 그 계정의 데이터(구독, 기록, 재생목록 …)를 불러와요.
void accountStore.init();

// BrowserRouter: 주소창의 경로(/watch/v1 등)를 읽어서 앱 안에서 쓸 수 있게 해줘요.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
