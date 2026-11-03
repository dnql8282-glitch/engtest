# MyTube — 공부용 영상 앱 클론

YouTube 웹사이트처럼 동작하는 영상 앱을 **서버 없이** 만들어 보는 학습 프로젝트예요.

## 실행 방법

```bash
npm install
npm run dev     # http://localhost:5173 에서 확인
```

## 기술 스택

- **TypeScript**: youtube.com도 JavaScript/TypeScript로 만들어져 있어요.
- **React**: 화면을 컴포넌트 단위로 만들어요.
- **Vite**: 개발 서버와 빌드를 맡아요.

## 폴더 구조 (이식성이 핵심)

```
src/
  core/               ← React/브라우저에 의존하지 않는 순수 TypeScript
    types.ts          데이터 타입 정의
    format.ts         조회수·시간 표시 함수
    videoService.ts   데이터 접근 (나중에 서버 API로 교체할 자리)
    data/             가짜(mock) 데이터
  web/                ← 웹 전용 화면 (React DOM)
    components/       Header, Sidebar, VideoCard, Thumbnail
    pages/            HomePage
  App.tsx             앱 뼈대 (레이아웃)
```

`core/`는 화면 코드와 분리돼 있어요. 그래서 나중에 React Native로 모바일 앱을 만들 때 `core/`를 그대로 가져가고, 화면(`web/`)만 새로 만들면 돼요.

## 개발 로드맵

- [x] **1단계**: 레이아웃(헤더·사이드바), 홈 영상 그리드, 카테고리 필터
- [x] **1.5단계**: YouTube 다크 모드 디자인 (레이아웃·색·크기 맞춤, Material 아이콘, 반응형)
- [ ] **2단계**: 영상 시청 페이지 (라우팅, 비디오 플레이어, 추천 영상 목록)
- [ ] **3단계**: 검색 기능
- [ ] **4단계**: 좋아요, 댓글, 구독 (localStorage에 저장)
- [ ] **5단계**: 시청 기록, 보관함, 다크 모드 토글

## 데이터 출처

- 영상: test-videos.co.uk의 오픈 라이선스 샘플 영상 (Big Buck Bunny, Sintel 등)
- 썸네일: picsum.photos 무료 사진
- 아이콘: Google Material Icons (Apache 2.0)
- 로고와 이름(MyTube)은 YouTube 상표와 구분되도록 따로 만들었어요.
