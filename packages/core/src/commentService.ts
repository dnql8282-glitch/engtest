import type { Comment } from './types';
import { videos } from './data/videos';
import { seedComments } from './data/comments';
import { readJson, writeJson } from './storage';

// 댓글 서비스. 가짜 댓글 + 내가 쓴 댓글(저장소에 보관)을 합쳐서 돌려줘요.
// 서버가 생기면 GET/POST/DELETE /videos/:id/comments 로 바꾸면 되는 자리예요.

const KEY = 'myComments';

async function loadMine(): Promise<Comment[]> {
  return readJson<Comment[]>(KEY, []);
}

export async function getComments(videoId: string): Promise<Comment[]> {
  const video = videos.find((v) => v.id === videoId);
  if (!video) return [];
  const mine = (await loadMine())
    .filter((c) => c.videoId === videoId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...mine, ...seedComments(videoId, video.uploadedAt)]; // 내 댓글이 맨 위
}

export async function addComment(videoId: string, text: string): Promise<Comment> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('빈 댓글은 등록할 수 없어요');
  const comment: Comment = {
    id: `${videoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    videoId,
    author: '@나',
    authorColor: '#5c6bc0',
    text: trimmed,
    createdAt: new Date().toISOString(),
    likes: 0,
    mine: true,
  };
  await writeJson(KEY, [...(await loadMine()), comment]);
  return comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await writeJson(
    KEY,
    (await loadMine()).filter((c) => c.id !== commentId),
  );
}
