import { useState } from 'react';
import type { Comment } from '../../core/types';
import { addComment, deleteComment, getComments } from '../../core/commentService';
import { formatRelativeTime } from '../../core/format';
import { useAsync } from '../hooks/useAsync';
import { Icon } from './Icon';

// 댓글 영역: 댓글 수, 입력창, 목록
// 댓글은 이 영상에서만 쓰는 데이터라 전역 상태가 아니라 이 컴포넌트의 지역 상태로 관리해요.
export function Comments({ videoId }: { videoId: string }) {
  const { data: loaded } = useAsync(getComments, videoId);
  // 서버(서비스)에서 받은 목록 위에, 이번에 내가 추가/삭제한 변화만 따로 기록해요.
  const [added, setAdded] = useState<Comment[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  if (!loaded) return <div className="comments" />;
  const comments = [...added, ...loaded].filter((c) => !removed.includes(c.id));

  return (
    <section className="comments">
      <h2 className="comments-count">댓글 {comments.length.toLocaleString('ko-KR')}개</h2>
      <CommentForm
        onSubmit={async (text) => {
          const c = await addComment(videoId, text);
          setAdded((prev) => [c, ...prev]);
        }}
      />
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          onDelete={async () => {
            setRemoved((prev) => [...prev, c.id]);
            await deleteComment(c.id);
          }}
        />
      ))}
    </section>
  );
}

function CommentForm({ onSubmit }: { onSubmit: (text: string) => Promise<void> }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <form
      className="comment-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await onSubmit(text);
        setText('');
        setFocused(false);
      }}
    >
      <span className="avatar large" style={{ background: '#5c6bc0' }}>나</span>
      <div className="comment-form-body">
        <input
          className="comment-input"
          placeholder="댓글 추가..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          aria-label="댓글 입력"
        />
        {focused && (
          <div className="comment-form-actions">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setText('');
                setFocused(false);
              }}
            >
              취소
            </button>
            <button type="submit" className="primary-btn" disabled={!text.trim()}>
              댓글
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

function CommentItem({ comment, onDelete }: { comment: Comment; onDelete: () => void }) {
  return (
    <div className="comment">
      <span className="avatar large" style={{ background: comment.authorColor }}>
        {comment.author.replace('@', '')[0]}
      </span>
      <div className="comment-body">
        <p className="comment-head">
          <span className="comment-author">{comment.author}</span>
          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
        </p>
        <p className="comment-text">{comment.text}</p>
        <div className="comment-actions">
          <button className="icon-btn small" aria-label="좋아요">
            <Icon name="thumbUpOutline" size={16} />
          </button>
          {comment.likes > 0 && <span className="comment-likes">{comment.likes}</span>}
          <button className="icon-btn small" aria-label="싫어요">
            <Icon name="thumbDownOutline" size={16} />
          </button>
          <button className="text-btn small">답글</button>
          {comment.mine && (
            <button className="text-btn small danger" onClick={onDelete}>
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
