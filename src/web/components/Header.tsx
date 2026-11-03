import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { SearchBox } from './SearchBox';
import { Menu } from './Menu';
import { userStore } from '../../core/userStore';
import { useUserState } from '../hooks/useUserStore';

interface HeaderProps {
  onToggleSidebar: () => void;
}

// 상단 바: [메뉴·로고] [검색창·음성검색] [만들기·알림·프로필]
// 모바일에서는 돋보기를 누르면 헤더 전체가 검색창으로 바뀌어요.
export function Header({ onToggleSidebar }: HeaderProps) {
  const [params] = useSearchParams();
  const query = params.get('search_query') ?? '';
  const [mobileSearch, setMobileSearch] = useState(false);
  const { theme } = useUserState();

  return (
    <header className={`header ${mobileSearch ? 'mobile-search' : ''}`}>
      <div className="header-start">
        <button className="icon-btn" aria-label="메뉴" onClick={onToggleSidebar}>
          <Icon name="menu" />
        </button>
        <Logo />
      </div>

      <div className="header-center">
        <button className="icon-btn mobile-back" aria-label="뒤로" onClick={() => setMobileSearch(false)}>
          <Icon name="arrowBack" />
        </button>
        {/* key: 주소의 검색어가 바뀌거나(뒤로가기 등) 모바일 검색을 열면 검색창을 새로 만들어요.
            새로 만들어져야 autoFocus가 다시 적용돼요. */}
        <SearchBox
          key={`${query}|${mobileSearch}`}
          initialQuery={query}
          autoFocus={mobileSearch}
          onSubmitted={() => setMobileSearch(false)}
        />
        <button className="icon-btn filled mic-btn" aria-label="음성으로 검색">
          <Icon name="mic" />
        </button>
      </div>

      <div className="header-end">
        <button className="icon-btn mobile-search-btn" aria-label="검색" onClick={() => setMobileSearch(true)}>
          <Icon name="search" />
        </button>
        <button className="create-btn">
          <Icon name="add" />
          <span>만들기</span>
        </button>
        <button className="icon-btn" aria-label="알림">
          <Icon name="bell" />
        </button>
        <Menu
          items={[
            {
              icon: <Icon name={theme === 'dark' ? 'sun' : 'moon'} />,
              label: theme === 'dark' ? '디자인: 밝은 테마로 바꾸기' : '디자인: 어두운 테마로 바꾸기',
              onSelect: () => userStore.setTheme(theme === 'dark' ? 'light' : 'dark'),
            },
          ]}
          trigger={(props) => (
            <button className="avatar-btn" aria-label="내 계정" {...props}>
              <span className="avatar small" style={{ background: '#5c6bc0' }}>나</span>
            </button>
          )}
        />
      </div>
    </header>
  );
}
