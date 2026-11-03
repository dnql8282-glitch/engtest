import { describe, expect, it } from 'vitest';
import { formatCount, formatDuration, formatRelativeTime } from './format';

describe('format', () => {
  it('조회수를 한국식 단위로 줄인다', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(6968)).toBe('6.9천');
    expect(formatCount(12345)).toBe('1.2만');
    expect(formatCount(2_205_0000)).toBe('2205만');
    expect(formatCount(123_456_789)).toBe('1.2억');
  });

  it('재생 시간을 시:분:초로 바꾼다', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('업로드 시간을 상대 시간으로 바꾼다', () => {
    const now = new Date('2026-11-03T12:00:00Z');
    expect(formatRelativeTime('2026-11-03T11:59:30Z', now)).toBe('방금 전');
    expect(formatRelativeTime('2026-11-01T12:00:00Z', now)).toBe('2일 전');
    expect(formatRelativeTime('2025-10-01T12:00:00Z', now)).toBe('1년 전');
  });
});
