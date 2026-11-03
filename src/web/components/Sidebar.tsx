interface SidebarProps {
  collapsed: boolean;
}

const items = [
  { icon: '🏠', label: '홈' },
  { icon: '🔥', label: '인기' },
  { icon: '📺', label: '구독' },
  { icon: '📚', label: '보관함' },
  { icon: '🕘', label: '시청 기록' },
  { icon: '👍', label: '좋아요 표시한 영상' },
];

// 왼쪽 메뉴. collapsed면 아이콘만 보여줘요.
export function Sidebar({ collapsed }: SidebarProps) {
  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {items.map((item, i) => (
        <a key={item.label} href="#" className={`sidebar-item ${i === 0 ? 'active' : ''}`}>
          <span className="sidebar-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
