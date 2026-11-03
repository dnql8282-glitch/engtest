import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './web/components/Header';
import { Sidebar, type SidebarVariant } from './web/components/Sidebar';
import { HomePage } from './web/pages/HomePage';
import { WatchPage } from './web/pages/WatchPage';
import { ResultsPage } from './web/pages/ResultsPage';
import { NotFoundPage } from './web/pages/NotFoundPage';
import { useMediaQuery } from './web/hooks/useMediaQuery';

export default function App() {
  const { pathname } = useLocation();
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
        {/* 라우팅 표: 주소 → 보여줄 페이지 */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/watch/:videoId" element={<WatchPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
