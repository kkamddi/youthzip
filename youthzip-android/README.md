# 청년혜택.zip Android

청년지원사업 검색, 상세 확인, 찜, 마감 일정, 로컬 마감 알림을 제공하는 Google Play 전용 Android 앱입니다. 웹사이트를 그대로 감싸지 않고 Capacitor 8과 별도 모바일 UI로 구성했습니다.

## 개발 환경

- Node.js 22 이상
- Android Studio와 Android SDK 36
- Java 21 (Android Studio의 내장 JBR 사용 가능)

## 실행과 빌드

```powershell
npm install
npm run dev
npm run android:sync
npm run android:debug
```

디버그 APK는 `android/app/build/outputs/apk/debug/app-debug.apk`에 생성됩니다. Play 제출용 AAB는 서명 설정을 마친 뒤 `npm run android:bundle`로 생성합니다.

## 데이터 구조

- 목록 API: `https://youthzip.pages.dev/data/app/index.json`
- 상세 API: `https://youthzip.pages.dev/data/app/policy/{id}.json`
- 최초 설치용 목록: `public/data/fallback.json`
- 찜과 검색 조건: Android 기기 로컬 저장
- 마감 알림: Android 기기 로컬 알림

정책 API는 기존 `pages-youth-policy/scripts/generate-pages.mjs`가 홈페이지와 함께 하루 두 번 갱신합니다. 따라서 정책 변경만으로 앱을 다시 배포할 필요가 없습니다.
