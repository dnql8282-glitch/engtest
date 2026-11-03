import { useState } from 'react';
import { Header } from './web/components/Header';
import { Sidebar } from './web/components/Sidebar';
import { HomePage } from './web/pages/HomePage';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app">
      <Header onToggleSidebar={() => setSidebarCollapsed((v) => !v)} />
      <div className="body">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="main">
          <HomePage />
        </main>
      </div>
    </div>
  );
}
