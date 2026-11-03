import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { countUnread, getNotifications } from '@mytube/core/videoService';
import { formatRelativeTime } from '@mytube/core/format';
import { userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { Icon } from './Icon';

// 종 모양 알림 버튼: 구독 채널의 새 영상 목록 + 읽지 않은 개수 배지
export function NotificationsButton() {
  const { subscriptions, notificationsSeenAt } = useUserState();
  const { data: list = [] } = useAsync(getNotifications, subscriptions.join(','));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = countUnread(list, notificationsSeenAt);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        className="icon-btn"
        aria-label={unread ? `알림 (읽지 않음 ${unread}개)` : '알림'}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) userStore.markNotificationsSeen(); // 열면 모두 읽음
        }}
      >
        <Icon name="bell" />
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-popup" role="dialog" aria-label="알림">
          <div className="notif-head">알림</div>
          {list.length === 0 ? (
            <p className="notif-empty">구독한 채널의 새 소식이 여기에 표시됩니다.</p>
          ) : (
            list.map((n) => (
              <Link key={n.id} to={`/watch/${n.video.id}`} className="notif-item" onClick={() => setOpen(false)}>
                <span className="avatar" style={{ background: n.video.channel.avatarColor }}>{n.video.channel.name[0]}</span>
                <span className="notif-text">
                  <span>
                    <b>{n.video.channel.name}</b>에서 업로드한 동영상: {n.video.title}
                  </span>
                  <span className="notif-time">{formatRelativeTime(n.createdAt)}</span>
                </span>
                <img src={n.video.thumbnailUrl} alt="" className="notif-thumb" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
