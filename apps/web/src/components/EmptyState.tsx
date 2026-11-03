import type { ReactNode } from 'react';

// 빈 화면 안내 (검색 결과 없음, 시청 기록 없음 등에서 재사용)
export function EmptyState({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="not-found">
      <p className="not-found-emoji">{emoji}</p>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
