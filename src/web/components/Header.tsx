interface HeaderProps {
  onToggleSidebar: () => void;
}

// 상단 바: 메뉴 버튼, 로고, 검색창(3단계에서 동작 연결), 프로필
export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn" aria-label="메뉴" onClick={onToggleSidebar}>
          ☰
        </button>
        <a href="/" className="logo">
          <span className="logo-mark">▶</span>
          <span className="logo-text">MyTube</span>
        </a>
      </div>
      <form className="search" onSubmit={(e) => e.preventDefault()}>
        <input className="search-input" placeholder="검색" />
        <button className="search-btn" aria-label="검색">🔍</button>
      </form>
      <div className="header-right">
        <div className="avatar" style={{ background: '#6366f1' }}>나</div>
      </div>
    </header>
  );
}
