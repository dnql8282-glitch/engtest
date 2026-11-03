# MyTube — 공부용 영상 앱 클론

YouTube처럼 동작하는 영상 앱을 **서버 없이** 만들어 보는 학습 프로젝트예요.
**웹 앱**과 **iOS·안드로이드 앱**이 같은 핵심 코드(`packages/core`)를 함께 써요.

![홈 화면](docs/screenshot-desktop.jpg)

![시청 페이지](docs/screenshot-watch.jpg)

<img src="docs/screenshot-mobile.jpg" width="240" alt="모바일 화면" />

## 실행 방법

```bash
npm install          # 저장소 루트에서 한 번
npm run dev:web      # 웹 앱: http://localhost:5173
npm test             # core 로직 자동 테스트
npm run encode       # (선택) 스트리밍용 영상 다시 만들기 — ffmpeg 필요
npm run storyboard   # (선택) 타임바 미리보기 장면 다시 만들기 — ffmpeg 필요
```

### 구글 로그인 설정 (선택)

1. [Google Cloud Console](https://console.cloud.google.com) → API 및 서비스 → 사용자 인증 정보 → **OAuth 클라이언트 ID 만들기** → 유형: 웹 애플리케이션
2. **승인된 JavaScript 원본**에 `http://localhost:5173` 추가
3. `apps/web/.env.example`을 `apps/web/.env.local`로 복사하고 `VITE_GOOGLE_CLIENT_ID=발급받은ID` 입력
4. `npm run dev:web` 다시 실행 → 오른쪽 위 "로그인"

설정하지 않아도 **테스트 계정**으로 계정별 기능(기록·재생목록·이어 보기)을 모두 써 볼 수 있어요.

모바일 앱(아이폰·안드로이드) 실행 방법은 [apps/mobile/README.md](apps/mobile/README.md)에 있어요.

![iPhone 앱 화면](docs/screenshot-ios.jpg)

## 기술 스택

- **TypeScript**: youtube.com도 JavaScript/TypeScript로 만들어져 있어요.
- **웹**: React + Vite
- **모바일**: React Native + Expo SDK 58 (expo-router, expo-video)
- **npm workspaces**: 저장소 하나에 여러 앱과 공용 패키지를 함께 관리해요(모노레포).

## 폴더 구조

```
packages/
  core/      순수 TypeScript — 타입, 데이터 서비스, 검색 규칙, 전역 상태(userStore, playerStore), 저장소 약속
  hooks/     React 훅 — useAsync, useUserState, usePlayerState (웹·모바일 공용, DOM/네이티브 없음)
apps/
  web/       웹 앱 (React DOM + CSS)
  mobile/    iOS·안드로이드 앱 (React Native + Expo)
tools/
  encode/    YouTube 방식 인코딩 파이프라인 (ffmpeg: AV1·H.264 화질 사다리, Opus·AAC 48kHz, DASH+HLS)
docs/        단계별 설명(STAGES.md), 요청 체크리스트(CHECKLIST.md), 스크린샷
```

## 아키텍처 한눈에 보기

```
화면 층   (apps/web, apps/mobile)  플랫폼마다 따로 만듦
   ↓ 요청만 함
서비스 층 (packages/core)        화면이 데이터를 얻는 유일한 창구 (웹·모바일 공용)
   ↓
데이터 층 (packages/core/data)   지금은 가짜 데이터, 나중엔 서버 API
```

- 위층은 바로 아래층만 알고, 아래층은 위층을 몰라요.
- 서버를 붙일 때는 서비스 층 안쪽만 바꾸면 되고, 모바일로 옮길 때는 화면 층만 새로 만들면 돼요.
- 모든 기능은 **상태 → 요청 → 응답 → 다시 그리기** 흐름으로 동작해요.

단계별 자세한 설명은 [docs/STAGES.md](docs/STAGES.md), 요청 진행 상황은 [docs/CHECKLIST.md](docs/CHECKLIST.md)에 있어요.

## 개발 로드맵

- [x] **1단계**: 레이아웃(헤더·사이드바), 홈 영상 그리드, 카테고리 필터
- [x] **1.5단계**: YouTube 다크 모드 디자인 (레이아웃·색·크기 맞춤, Material 아이콘, 반응형)
- [x] **2단계**: 영상 시청 페이지 (라우팅, 비디오 플레이어, 추천 영상 목록)
- [x] **3단계**: 검색 기능 (자동완성, 결과 페이지, 테스트)
- [x] **4단계**: 좋아요, 댓글, 구독 (저장소 추상화 + 전역 상태)
- [x] **5단계**: 시청 기록, 좋아요/나중에 볼 재생목록, 구독 피드, 인기 급상승, 채널 페이지, 테마 전환
- [x] **6단계**: iOS·안드로이드 앱 (YouTube iOS 앱 UI, 미니 플레이어, PiP, 백그라운드·잠금 화면 재생) — ⏸ 보류 중
- [x] **웹 다듬기 W1~W8**: 계정·구글 로그인·시청 진행선·이어서 보기, 타임바(미리보기·챕터·정밀 탐색·2배속·두 번 탭), 실제 영상, YouTube 스타일 플레이어·단축키, 웹 미니 플레이어, 모바일 레이아웃, Shorts, 공유·알림·답글, 적응형 스트리밍(AV1/H.264, Opus/AAC 48kHz, 화질 선택)

## 주요 화면과 주소

| 주소 | 화면 |
|---|---|
| `/` , `/?category=게임` | 홈 (카테고리) |
| `/watch/v1` | 시청 페이지 (구독, 좋아요, 댓글) |
| `/results?search_query=요리` | 검색 결과 |
| `/feed/trending` · `/feed/subscriptions` · `/feed/history` · `/feed/you` | 인기 급상승 · 구독 · 시청 기록 · 나 |
| `/shorts` | Shorts (세로 넘기기) |
| `/watch/v1?t=95` | 1분 35초부터 재생 |
| `/playlist?list=LL` · `/playlist?list=WL` | 좋아요 표시한 동영상 · 나중에 볼 동영상 |
| `/channel/c1` | 채널 페이지 |

사용자 데이터(구독, 좋아요, 댓글, 기록, 테마)는 브라우저 localStorage에 저장돼요. 서버는 없어요.

## 데이터 출처

- 영화: Big Buck Bunny, Sintel, Elephants Dream, Tears of Steel, Cosmos Laundromat — © Blender Foundation, CC BY (studio.blender.org/films)
- 공원 산책 클립: samplelib.com 무료 샘플 · 꽃 타임랩스: MDN 예제 영상(CC0) · 타이머: W3C 미디어 테스트 파일
- 썸네일: 각 영상의 실제 장면을 캡처했어요 (`apps/web/public/thumbs`)
- 채널과 조회수, 댓글은 가짜 데이터예요.
- 아이콘: Google Material Icons (Apache 2.0)
- 로고와 이름(MyTube)은 YouTube 상표와 구분되도록 따로 만들었어요.
