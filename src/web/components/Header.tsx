import { Icon } from './Icon';
import { Logo } from './Logo';

interface HeaderProps {
  onToggleSidebar: () => void;
}

// 상단 바: [메뉴·로고] [검색창·음성검색] [만들기·알림·프로필]
export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-start">
        <button className="icon-btn" aria-label="메뉴" onClick={onToggleSidebar}>
          <Icon name="menu" />
        </button>
        <Logo />
      </div>

      <div className="header-center">
        <form className="search" onSubmit={(e) => e.preventDefault()}>
          <div className="search-box">
            <input className="search-input" placeholder="검색" />
          </div>
          <button className="search-btn" aria-label="검색">
            <Icon name="search" />
          </button>
        </form>
        <button className="icon-btn filled" aria-label="음성으로 검색">
          <Icon name="mic" />
        </button>
      </div>

      <div className="header-end">
        <button className="create-btn">
          <Icon name="add" />
          <span>만들기</span>
        </button>
        <button className="icon-btn" aria-label="알림">
          <Icon name="bell" />
        </button>
        <button className="avatar-btn" aria-label="내 계정">
          <span className="avatar small" style={{ background: '#5c6bc0' }}>나</span>
        </button>
      </div>
    </header>
  );
}
