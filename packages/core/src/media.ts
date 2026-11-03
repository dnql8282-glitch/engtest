// 썸네일·스트리밍 파일 주소 만들기
// 데이터에는 "/thumbs/v1.jpg"처럼 사이트 기준 경로만 적어 둬요.
//  - 웹: 같은 사이트에서 서비스하니까 그대로 쓰면 돼요 (기본값 '')
//  - 앱: 파일이 있는 서버 주소를 앞에 붙여야 해요 (예: 같은 와이파이의 개발 PC http://192.168.0.10:5173)
// 앱 시작 시 setMediaBase()로 한 번만 정해요. (저장소 configureStore와 같은 "끼워 넣기" 방식)

let base = '';

export function setMediaBase(url: string) {
  base = url.replace(/\/+$/, '');
}

export function mediaUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path; // 이미 전체 주소
  return base + path;
}
