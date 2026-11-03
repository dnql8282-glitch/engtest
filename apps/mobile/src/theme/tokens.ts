// 디자인 토큰 — 웹의 CSS 변수(--bg, --text ...)와 같은 이름, 같은 값.
// 플랫폼은 달라도 "색 이름표"는 공유해요.
export const darkTokens = {
  bg: '#0f0f0f',
  text: '#f1f1f1',
  textSub: '#aaaaaa',
  textMuted: '#717171',
  surface: 'rgba(255,255,255,0.1)',
  surfaceHover: 'rgba(255,255,255,0.2)',
  divider: 'rgba(255,255,255,0.15)',
  sheet: '#212121', // 바텀시트, 미니 플레이어
  invertBg: '#f1f1f1', // 구독 버튼(흰 배경)
  invertText: '#0f0f0f',
  link: '#3ea6ff',
  danger: '#ff6b6b',
  brand: '#ff0033',
};

export type Tokens = typeof darkTokens;

export const lightTokens: Tokens = {
  bg: '#ffffff',
  text: '#0f0f0f',
  textSub: '#606060',
  textMuted: '#909090',
  surface: 'rgba(0,0,0,0.05)',
  surfaceHover: 'rgba(0,0,0,0.1)',
  divider: 'rgba(0,0,0,0.1)',
  sheet: '#ffffff',
  invertBg: '#0f0f0f',
  invertText: '#ffffff',
  link: '#065fd4',
  danger: '#cc0000',
  brand: '#ff0033',
};

// 크기 토큰 (YouTube iOS 앱 기준)
export const layout = {
  topBarHeight: 48,
  tabBarHeight: 50, // + 하단 안전 영역(홈 인디케이터)
  miniPlayerHeight: 56,
};
