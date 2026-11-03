import { useEffect } from 'react';

// 브라우저 탭 제목: "영상 제목 - MyTube" (제목이 없으면 그냥 MyTube)
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} - MyTube` : 'MyTube';
  }, [title]);
}
