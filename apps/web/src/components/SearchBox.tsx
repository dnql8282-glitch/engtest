import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuggestions } from '@mytube/core/videoService';
import { Icon } from './Icon';

interface SearchBoxProps {
  initialQuery: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}

// 검색창 + 자동완성 목록.
// 검색하면 /results?search_query=검색어 로 이동해요. (YouTube와 같은 주소 규칙)
// 검색어를 주소에 담기 때문에 뒤로가기, 새로고침, 링크 공유가 모두 자연스럽게 동작해요.
export function SearchBox({ initialQuery, autoFocus, onSubmitted }: SearchBoxProps) {
  const navigate = useNavigate();
  const [text, setText] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1); // 키보드 ↑↓로 고른 자동완성 위치
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    getSuggestions(text).then((list) => {
      if (!cancelled) setSuggestions(list);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const submit = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setText(q);
    setOpen(false);
    inputRef.current?.blur();
    navigate(`/results?search_query=${encodeURIComponent(q)}`);
    onSubmitted?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit(highlight >= 0 && showList ? suggestions[highlight] : text);
      }}
    >
      <div className={`search-box ${showList ? 'with-list' : ''}`}>
        <span className="search-leading-icon">
          <Icon name="search" size={20} />
        </span>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="검색"
          value={text}
          autoFocus={autoFocus}
          onChange={(e) => {
            setText(e.target.value);
            setHighlight(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // 목록 항목을 누를 시간을 주기 위해 살짝 늦게 닫아요
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          aria-label="검색어"
        />
        {text && (
          <button
            type="button"
            className="icon-btn search-clear"
            aria-label="검색어 지우기"
            onClick={() => {
              setText('');
              inputRef.current?.focus();
            }}
          >
            <Icon name="close" />
          </button>
        )}
        {showList && (
          <ul className="suggestions" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? 'highlighted' : ''}
                onMouseDown={(e) => {
                  e.preventDefault(); // 입력창 포커스가 빠지기 전에 처리
                  submit(s);
                }}
              >
                <Icon name="search" size={20} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="search-btn" aria-label="검색">
        <Icon name="search" />
      </button>
    </form>
  );
}
