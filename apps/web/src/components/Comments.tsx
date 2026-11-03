import { useState } from 'react';
import type { Comment, CommentSort } from '@mytube/core/types';
import { addComment, buildThreads, deleteComment, getComments } from '@mytube/core/commentService';
import { formatRelativeTime } from '@mytube/core/format';
import { userStore } from '@mytube/core/userStore';
import { useAsync } from '@mytube/hooks/useAsync';
import { useUserState } from '@mytube/hooks/useUserStore';
import { Icon } from './Icon';
import { Menu } from './Menu';
import { AccountAvatar } from './AccountAvatar';

// 댓글 영역: 댓글 수 + 정렬 메뉴, 입력창, 댓글과 답글
// 댓글은 이 영상에서만 쓰는 데이터라 지역 상태로 관리하고,
// 정렬·답글 묶기 같은 규칙은 core의 순수 함수(buildThreads)에 맡겨요.
export function Comments({ videoId }: { videoId: string }) {
  const { data: loaded } = useAsync(getComments, videoId);
  // 서비스에서 받은 목록 위에, 이번에 내가 추가/삭제한 변화만 따로 기록해요.
  const [added, setAdded] = useState<Comment[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [sort, setSort] = useState<CommentSort>('top');

  if (!loaded) return <div className="comments" />;
  const all = [...added, ...loaded].filter((c) => !removed.includes(c.id) && !removed.includes(c.parentId ?? ''));
  const threads = buildThreads(all, sort);

  const add = async (text: string, parentId?: string) => {
    const c = await addComment(videoId, text, parentId);
    setAdded((prev) => [c, ...prev]);
  };
  const remove = async (id: string) => {
    setRemoved((prev) => [...prev, id]);
    await deleteComment(id);
  };

  return (
    <section className="comments">
      <div className="comments-head">
        <h2 className="comments-count">댓글 {all.length.toLocaleString('ko-KR')}개</h2>
        <Menu
          align="left"
          items={[
            { label: `${sort === 'top' ? '✓ ' : ''}인기 댓글순`, onSelect: () => setSort('top') },
            { label: `${sort === 'newest' ? '✓ ' : ''}최신순`, onSelect: () => setSort('newest') },
          ]}
          trigger={(props) => (
            <button className="comments-sort" {...props}>
              <Icon name="sort" />
              <span>정렬 기준</span>
            </button>
          )}
        />
      </div>
      <CommentForm placeholder="댓글 추가..." onSubmit={(t) => add(t)} />
      {threads.map(({ comment, replies }) => (
        <Thread key={comment.id} comment={comment} replies={replies} onReply={(t) => add(t, comment.id)} onDelete={remove} />
      ))}
    </section>
  );
}

function Thread({
  comment,
  replies,
  onReply,
  onDelete,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="thread">
      <CommentItem comment={comment} onReply={() => setReplying(true)} onDelete={() => void onDelete(comment.id)} />
      <div className="thread-children">
        {replying && (
          <CommentForm
            small
            autoFocus
            placeholder="답글 추가..."
            submitLabel="답글"
            onCancel={() => setReplying(false)}
            onSubmit={async (t) => {
              await onReply(t);
              setReplying(false);
              setShowReplies(true);
            }}
          />
        )}
        {replies.length > 0 && (
          <button className="replies-toggle" onClick={() => setShowReplies((v) => !v)} aria-expanded={showReplies}>
            <Icon name={showReplies ? 'expandLess' : 'expandMore'} />
            답글 {replies.length}개
          </button>
        )}
        {showReplies &&
          replies.map((r) => <CommentItem key={r.id} comment={r} small onDelete={() => void onDelete(r.id)} />)}
      </div>
    </div>
  );
}

function CommentForm({
  onSubmit,
  onCancel,
  placeholder,
  submitLabel = '댓글',
  small = false,
  autoFocus = false,
}: {
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  placeholder: string;
  submitLabel?: string;
  small?: boolean;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(autoFocus);

  return (
    <form
      className={`comment-form ${small ? 'small' : ''}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await onSubmit(text);
        setText('');
        setFocused(false);
      }}
    >
      <AccountAvatar size={small ? 32 : 40} />
      <div className="comment-form-body">
        <input
          className="comment-input"
          placeholder={placeholder}
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          aria-label={placeholder}
        />
        {focused && (
          <div className="comment-form-actions">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setText('');
                setFocused(false);
                onCancel?.();
              }}
            >
              취소
            </button>
            <button type="submit" className="primary-btn" disabled={!text.trim()}>
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  small = false,
}: {
  comment: Comment;
  onReply?: () => void;
  onDelete: () => void;
  small?: boolean;
}) {
  const { likedComments } = useUserState();
  const liked = likedComments.includes(comment.id);
  const likes = comment.likes + (liked ? 1 : 0);

  return (
    <div className={`comment ${small ? 'small' : ''}`}>
      <span className={`avatar ${small ? 'small' : 'large'}`} style={{ background: comment.authorColor }}>
        {comment.author.replace('@', '')[0]}
      </span>
      <div className="comment-body">
        <p className="comment-head">
          <span className="comment-author">{comment.author}</span>
          <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
        </p>
        <p className="comment-text">{comment.text}</p>
        <div className="comment-actions">
          <button
            className="icon-btn small"
            aria-label="좋아요"
            aria-pressed={liked}
            onClick={() => userStore.toggleCommentLike(comment.id)}
          >
            <Icon name={liked ? 'thumbUp' : 'thumbUpOutline'} size={16} />
          </button>
          {likes > 0 && <span className="comment-likes">{likes.toLocaleString('ko-KR')}</span>}
          <button className="icon-btn small" aria-label="싫어요">
            <Icon name="thumbDownOutline" size={16} />
          </button>
          {onReply && (
            <button className="text-btn small" onClick={onReply}>
              답글
            </button>
          )}
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
