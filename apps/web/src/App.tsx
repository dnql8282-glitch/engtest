import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar, type SidebarVariant } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { WatchPage } from './pages/WatchPage';
import { ResultsPage } from './pages/ResultsPage';
import { TrendingPage } from './pages/TrendingPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { HistoryPage } from './pages/HistoryPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { ChannelPage } from './pages/ChannelPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ShortsPage } from './pages/ShortsPage';
import { YouPage } from './pages/YouPage';
import { BottomNav } from './components/BottomNav';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useUserState } from '@mytube/hooks/useUserStore';
import { PlayerController } from './player/PlayerController';
import { MiniPlayer } from './player/MiniPlayer';

export default function App() {
  const { pathname } = useLocation();
  const { theme } = useUserState();

  // 테마: 전역 상태의 값을 <html data-theme="..."> 에 반영하면 CSS 변수들이 바뀌어요.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // 시청 페이지와 모바일에서는 사이드바를 숨기고, 메뉴 버튼으로 서랍(drawer)처럼 열어요.
  const isNarrow = useMediaQuery('(max-width: 792px)');
  const useDrawer = isNarrow || pathname.startsWith('/watch');

  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1312);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const variant: SidebarVariant = useDrawer ? 'drawer' : collapsed ? 'mini' : 'full';
  const toggleMenu = () => (useDrawer ? setDrawerOpen((v) => !v) : setCollapsed((v) => !v));

  return (
    <div className={`app guide-${variant}`}>
      <Header onToggleSidebar={toggleMenu} />
      <Sidebar
        variant={variant}
        drawerOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onToggle={toggleMenu}
      />
      <main className="main">
        {/* 라우팅 표: 주소 → 보여줄 페이지 (주소 규칙은 실제 YouTube와 같게 맞췄어요) */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/watch/:videoId" element={<WatchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/feed/trending" element={<TrendingPage />} />
          <Route path="/feed/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/feed/history" element={<HistoryPage />} />
          <Route path="/feed/you" element={<YouPage />} />
          <Route path="/shorts" element={<ShortsPage />} />
          <Route path="/playlist" element={<PlaylistPage />} />
          <Route path="/channel/:channelId" element={<ChannelPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* 재생 엔진과 미니 플레이어는 페이지 밖(앱 맨 위층)에 있어서 페이지를 옮겨도 살아 있어요 */}
      <PlayerController />
      <MiniPlayer />
      {/* 휴대폰 화면에서만 보이는 하단 메뉴 (CSS로 표시/숨김) */}
      <BottomNav />
    </div>
  );
}
