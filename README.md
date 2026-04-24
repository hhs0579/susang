# Vue 3 + Vite + Firebase

Vue 3(Vite) 프로젝트에 Firebase SDK가 함께 설치되어 있습니다.

## 실행 방법

1. 환경 변수 파일 생성

```bash
cp .env.example .env
```

2. Firebase 콘솔에서 발급받은 값을 `.env`에 입력

3. 개발 서버 실행

```bash
npm run dev
```

## 관리자 페이지

- 로그인 주소: `/admin`
- 관리자 대시보드: `/admin/dashboard`
- 기본 로그인 값은 `.env`의 `VITE_ADMIN_ID`, `VITE_ADMIN_PASSWORD`를 사용합니다.
- 로그인 후 카테고리 이미지 URL 변경, 신상품 추가/삭제가 가능합니다.
- 수정 데이터는 localStorage에 저장되며 메인(`/`)에 즉시 반영됩니다.

## Firebase 초기화 파일

- `src/firebase.js`에서 Firebase 앱을 초기화합니다.
- `auth`, `db`를 export 하므로 필요한 컴포넌트/스토어에서 import 해서 바로 사용할 수 있습니다.
