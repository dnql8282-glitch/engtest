import { useState } from 'react';
import { accountStore } from '@mytube/core/accountStore';
import { Modal } from '../ui/Modal';
import { GoogleSignInButton } from './GoogleSignInButton';
import { toast } from '../ui/toast';

// 로그인 창: 구글 로그인 + (구글 설정이 없을 때도 시험할 수 있는) 테스트 계정
export function SignInDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Modal title="로그인" onClose={onClose}>
      <p className="signin-lead">로그인하면 구독, 시청 기록, 재생목록, 이어서 보기가 계정별로 저장돼요.</p>
      <GoogleSignInButton onDone={onClose} />
      <div className="signin-divider">
        <span>또는 테스트 계정</span>
      </div>
      <form
        className="share-row"
        onSubmit={async (e) => {
          e.preventDefault();
          await accountStore.createLocal(name);
          toast(`${name.trim() || '새 계정'} 계정을 만들었어요`);
          onClose();
        }}
      >
        <input className="share-url" placeholder="이름 (예: 민수)" value={name} onChange={(e) => setName(e.target.value)} aria-label="테스트 계정 이름" />
        <button className="primary-btn">만들기</button>
      </form>
      <p className="signin-hint">테스트 계정은 이 기기에만 있는 계정이에요. 계정별 기능을 확인할 때 쓰세요.</p>
    </Modal>
  );
}
