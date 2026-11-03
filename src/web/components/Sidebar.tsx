import { useEffect, useState } from 'react';
import type { Channel } from '../../core/types';
import { getSubscriptions } from '../../core/videoService';
import { Icon, type IconName } from './Icon';

interface SidebarProps {
  collapsed: boolean;
}

interface NavItem {
  icon: IconName;
  label: string;
}

const mainItems: NavItem[] = [
  { icon: 'home', label: '홈' },
  { icon: 'fire', label: '인기 급상승' },
  { icon: 'subscriptions', label: '구독' },
];
const youItems: NavItem[] = [
  { icon: 'history', label: '시청 기록' },
  { icon: 'playlist', label: '재생목록' },
  { icon: 'clock', label: '나중에 볼 동영상' },
  { icon: 'thumbUp', label: '좋아요 표시한 동영상' },
];
const exploreItems: NavItem[] = [
  { icon: 'music', label: '음악' },
  { icon: 'game', label: '게임' },
  { icon: 'trophy', label: '스포츠' },
];

function NavLink({ item, active = false }: { item: NavItem; active?: boolean }) {
  return (
    <a href="#" className={`guide-item ${active ? 'active' : ''}`}>
      <Icon name={item.icon} />
      <span className="guide-label">{item.label}</span>
    </a>
  );
}

// 왼쪽 가이드 메뉴. 펼침(240px) / 미니(72px) 두 가지 모양이 있어요.
export function Sidebar({ collapsed }: SidebarProps) {
  const [subs, setSubs] = useState<Channel[]>([]);
  useEffect(() => {
    getSubscriptions().then(setSubs);
  }, []);

  if (collapsed) {
    return (
      <nav className="mini-guide">
        {[...mainItems, { icon: 'history', label: '나' } as NavItem].map((item, i) => (
          <a key={item.label} href="#" className={`mini-item ${i === 0 ? 'active' : ''}`}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav className="guide">
      <section className="guide-section">
        {mainItems.map((item, i) => (
          <NavLink key={item.label} item={item} active={i === 0} />
        ))}
      </section>

      <section className="guide-section">
        <a href="#" className="guide-title">
          나 <Icon name="chevronRight" size={20} />
        </a>
        {youItems.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </section>

      <section className="guide-section">
        <h3 className="guide-title">구독</h3>
        {subs.map((c) => (
          <a key={c.id} href="#" className="guide-item">
            <span className="avatar tiny" style={{ background: c.avatarColor }}>{c.name[0]}</span>
            <span className="guide-label">{c.name}</span>
          </a>
        ))}
      </section>

      <section className="guide-section">
        <h3 className="guide-title">탐색</h3>
        {exploreItems.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </section>

      <footer className="guide-footer">
        <p>공부용 클론 프로젝트입니다.</p>
        <p>© 2026 MyTube</p>
      </footer>
    </nav>
  );
}
