import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './web/components/Header';
import { Sidebar, type SidebarVariant } from './web/components/Sidebar';
import { HomePage } from './web/pages/HomePage';
import { WatchPage } from './web/pages/WatchPage';
import { ResultsPage } from './web/pages/ResultsPage';
import { TrendingPage } from './web/pages/TrendingPage';
import { SubscriptionsPage } from './web/pages/SubscriptionsPage';
import { HistoryPage } from './web/pages/HistoryPage';
import { PlaylistPage } from './web/pages/PlaylistPage';
import { ChannelPage } from './web/pages/ChannelPage';
import { NotFoundPage } from './web/pages/NotFoundPage';
import { useMediaQuery } from './web/hooks/useMediaQuery';
import { useUserState } from './web/hooks/useUserStore';

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
          <Route path="/playlist" element={<PlaylistPage />} />
          <Route path="/channel/:channelId" element={<ChannelPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
