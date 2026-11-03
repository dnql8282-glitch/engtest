import { describe, expect, it } from 'vitest';
import { adjacentChapterTime, chapterIndexAt, chapterRanges, mostReplayed, parseTimestamp, snapToChapter, splitTimestamps } from './chapters';

const ch = [
  { start: 0, title: '시작' },
  { start: 60, title: '중간' },
  { start: 120, title: '끝' },
];

describe('챕터', () => {
  it('시간이 속한 챕터와 구간', () => {
    expect(chapterIndexAt(ch, 0)).toBe(0);
    expect(chapterIndexAt(ch, 90)).toBe(1);
    expect(chapterIndexAt(ch, 200)).toBe(2);
    expect(chapterRanges(ch, 180).at(-1)).toEqual({ start: 120, end: 180, title: '끝' });
  });

  it('이전/다음 챕터: 챕터 시작 3초 이후면 "이전"은 지금 챕터 처음으로', () => {
    expect(adjacentChapterTime(ch, 70, 1)).toBe(120);
    expect(adjacentChapterTime(ch, 130, 1)).toBeNull();
    expect(adjacentChapterTime(ch, 70, -1)).toBe(60);
    expect(adjacentChapterTime(ch, 61, -1)).toBe(0);
    expect(adjacentChapterTime([], 10, 1)).toBeNull();
  });

  it('끌 때 경계 근처면 경계에 붙는다 (0초 경계는 제외)', () => {
    expect(snapToChapter(ch, 180, 61 / 180, 0.01)).toEqual({ ratio: 60 / 180, snapped: true });
    expect(snapToChapter(ch, 180, 0.5, 0.01)).toEqual({ ratio: 0.5, snapped: false });
  });
});

describe('시간 표시 링크', () => {
  it('시간 글자 해석과 글 나누기', () => {
    expect(parseTimestamp('3:15')).toBe(195);
    expect(parseTimestamp('1:02:05')).toBe(3725);
    expect(splitTimestamps('3:15 부분 연출, 10:02도 좋아요')).toEqual([
      { label: '3:15', seconds: 195 },
      ' 부분 연출, ',
      { label: '10:02', seconds: 602 },
      '도 좋아요',
    ]);
    expect(splitTimestamps('시간 없음')).toEqual(['시간 없음']);
  });
});

describe('가장 많이 다시 본 장면', () => {
  it('0~1 사이 값 n개, 같은 영상은 항상 같은 모양', () => {
    const a = mostReplayed('v1', ch, 180);
    expect(a).toHaveLength(100);
    expect(Math.max(...a)).toBe(1);
    expect(Math.min(...a)).toBeGreaterThan(0);
    expect(mostReplayed('v1', ch, 180)).toEqual(a);
    expect(mostReplayed('v2', ch, 180)).not.toEqual(a);
  });
});
