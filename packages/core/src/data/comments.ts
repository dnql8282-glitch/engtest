import type { Comment } from '../types';

// 가짜 댓글 생성기. 영상 ID를 씨앗(seed)으로 써서 같은 영상에는 항상 같은 댓글이 나와요.
const authors = [
  ['@밤샘개발자', '#0ea5e9'],
  ['@요리초보', '#22c55e'],
  ['@주말여행러', '#f59e0b'],
  ['@고양이집사', '#ec4899'],
  ['@새벽감성', '#8b5cf6'],
  ['@오늘도출근', '#14b8a6'],
  ['@댓글요정', '#ef4444'],
] as const;

const texts = [
  '이게 무료로 공개된 작품이라니 믿기지가 않네요',
  '몇 번을 다시 봐도 마지막 장면에서 울컥해요',
  '3:15 부분 연출 진짜 미쳤다',
  '항상 좋은 영상 감사합니다 🙏',
  '다음 편도 기대할게요!',
  '알고리즘이 저를 여기로 데려왔네요',
  '배경음악 정보 알 수 있을까요?',
  '이걸 이제야 봤다니... 구독하고 갑니다',
  '화질 좋은 버전으로 다시 올려 주셔서 감사해요',
];

function hash(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function seedComments(videoId: string, uploadedAt: string): Comment[] {
  const h = hash(videoId);
  const count = 3 + (h % 4);
  const uploaded = new Date(uploadedAt).getTime();
  const span = Math.max(1, Date.now() - uploaded);
  return Array.from({ length: count }, (_, i) => {
    const [author, authorColor] = authors[(h + i * 3) % authors.length];
    return {
      id: `${videoId}-seed-${i}`,
      videoId,
      author,
      authorColor,
      text: texts[(h + i * 5) % texts.length],
      createdAt: new Date(uploaded + (span * (i + 1)) / (count + 2)).toISOString(),
      likes: ((h >> i) % 500) + i * 7,
      mine: false,
    };
  }).sort((a, b) => b.likes - a.likes); // 인기 댓글 순
}
