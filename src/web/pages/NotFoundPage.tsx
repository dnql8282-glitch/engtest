import { Link } from 'react-router-dom';

// 없는 주소나 없는 영상일 때
export function NotFoundPage() {
  return (
    <div className="not-found">
      <p className="not-found-emoji">📺</p>
      <h2>이 페이지를 사용할 수 없습니다.</h2>
      <p>주소가 올바른지 확인하거나 다른 영상을 찾아보세요.</p>
      <Link to="/" className="pill">홈으로 가기</Link>
    </div>
  );
}
