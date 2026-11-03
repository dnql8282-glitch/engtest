// 숫자, 시간 표시 형식을 바꾸는 함수들 (순수 함수라 테스트하기 쉬워요)

/** 1234 -> "1234", 12345 -> "1.2만", 123456789 -> "1.2억" */
export function formatCount(n: number): string {
  if (n >= 100_000_000) return `${trim(n / 100_000_000)}억`;
  if (n >= 10_000) return `${trim(n / 10_000)}만`;
  if (n >= 1_000) return `${trim(n / 1_000)}천`;
  return String(n);
}

function trim(x: number): string {
  // 10 이상이면 소수점 없이, 아니면 소수점 한 자리까지
  return x >= 10 ? String(Math.floor(x)) : String(Math.floor(x * 10) / 10);
}

/** 754 -> "12:34", 3725 -> "1:02:05" */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 업로드 날짜 -> "3일 전" 같은 상대 시간 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffSec = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, '년'],
    [60 * 60 * 24 * 30, '개월'],
    [60 * 60 * 24 * 7, '주'],
    [60 * 60 * 24, '일'],
    [60 * 60, '시간'],
    [60, '분'],
  ];
  for (const [size, label] of units) {
    if (diffSec >= size) return `${Math.floor(diffSec / size)}${label} 전`;
  }
  return '방금 전';
}

/** 1234567 -> "1,234,567" (시청 페이지 설명란처럼 정확한 숫자를 보여줄 때) */
export function formatFullCount(n: number): string {
  return n.toLocaleString('ko-KR');
}

/** ISO 날짜 -> "2026. 5. 3." */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}
