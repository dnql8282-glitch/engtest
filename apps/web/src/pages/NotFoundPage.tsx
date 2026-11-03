import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

// 없는 주소나 없는 영상일 때
export function NotFoundPage() {
  return (
    <EmptyState
      emoji="📺"
      title="이 페이지를 사용할 수 없습니다."
      text="주소가 올바른지 확인하거나 다른 영상을 찾아보세요."
      action={<Link to="/" className="pill">홈으로 가기</Link>}
    />
  );
}
