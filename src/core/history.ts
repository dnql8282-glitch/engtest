import type { HistoryEntry } from './userStore';

// 시청 기록을 "오늘 / 어제 / 11월 1일" 묶음으로 나누는 순수 함수
export interface HistoryGroup {
  label: string;
  entries: HistoryEntry[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function groupHistoryByDay(entries: HistoryEntry[], now: Date = new Date()): HistoryGroup[] {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const groups: HistoryGroup[] = [];
  for (const entry of entries) {
    const d = new Date(entry.watchedAt);
    const key = dayKey(d);
    const label =
      key === today
        ? '오늘'
        : key === yesterday
          ? '어제'
          : d.getFullYear() === now.getFullYear()
            ? `${d.getMonth() + 1}월 ${d.getDate()}일`
            : `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }
  return groups;
}
