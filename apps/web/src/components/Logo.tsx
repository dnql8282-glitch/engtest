import { Link } from 'react-router-dom';

export function Logo({ showRegion = true }: { showRegion?: boolean }) {
  return (
    <Link to="/" className="logo" aria-label="MyTube 홈">
      <span className="logo-mark">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff" style={{ marginLeft: 2 }}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="logo-text">MyTube</span>
      {showRegion && <sup className="logo-region">KR</sup>}
    </Link>
  );
}
