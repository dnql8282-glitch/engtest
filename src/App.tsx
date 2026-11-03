import { useState } from 'react';
import { Header } from './web/components/Header';
import { Sidebar } from './web/components/Sidebar';
import { HomePage } from './web/pages/HomePage';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    // YouTube처럼 화면이 좁으면 처음부터 미니 메뉴로 시작해요
    () => window.innerWidth < 1312,
  );

  return (
    <div className={`app ${sidebarCollapsed ? 'mini' : ''}`}>
      <Header onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
      <Sidebar collapsed={sidebarCollapsed} />
      <main className="main">
        <HomePage />
      </main>
    </div>
  );
}
