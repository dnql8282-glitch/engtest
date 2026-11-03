import type { Comment, CommentSort } from './types';
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

export async function addComment(videoId: string, text: string, parentId?: string): Promise<Comment> {
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
    ...(parentId ? { parentId } : {}),
  };
  await writeJson(KEY, [...(await loadMine()), comment]);
  return comment;
}

/** 댓글 삭제. 그 댓글에 달린 내 답글도 함께 지워요. */
export async function deleteComment(commentId: string): Promise<void> {
  await writeJson(
    KEY,
    (await loadMine()).filter((c) => c.id !== commentId && c.parentId !== commentId),
  );
}

// ── 순수 함수: 정렬과 답글 묶기 (화면과 무관, 테스트 가능) ──────────────────

export interface CommentThread {
  comment: Comment;
  replies: Comment[]; // 오래된 순 (대화 흐름대로)
}

/**
 * 댓글 목록을 "댓글 + 답글들" 묶음으로 만들고 정렬해요.
 *  top:    좋아요 많은 순 (단, 방금 내가 쓴 댓글은 YouTube처럼 맨 위)
 *  newest: 최신순
 */
export function buildThreads(comments: Comment[], sort: CommentSort): CommentThread[] {
  const replies = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    replies.set(c.parentId, [...(replies.get(c.parentId) ?? []), c]);
  }
  const top = comments.filter((c) => !c.parentId);
  const sorted = [...top].sort((a, b) => {
    if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
    if (a.mine !== b.mine) return a.mine ? -1 : 1;
    return b.likes - a.likes || b.createdAt.localeCompare(a.createdAt);
  });
  return sorted.map((comment) => ({
    comment,
    replies: (replies.get(comment.id) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));
}
