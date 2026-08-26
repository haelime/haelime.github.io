# haelime.github.io

Astro 7과 Markdown Content Collections로 만든 게임·그래픽스 프로그래밍 포트폴리오입니다.

## 로컬 실행

Node.js 22.19 이상이 설치된 환경에서:

```bash
npm ci
npm run dev
```

`http://localhost:4321/`에서 확인할 수 있습니다.

Docker를 사용하면:

```bash
docker compose up --build
```

## 검증

```bash
npm run build
```

타입 검사, Astro 정적 빌드, 기존 URL과 내부 링크, Clasher 비노출 설정을 함께 검사합니다.

## 콘텐츠

포트폴리오 글은 `src/content/portfolio/`, 블로그 글은 `src/content/blog/`, 정적 페이지는 `src/pages/`, 공개 이미지는 `public/assets/img/`에 둡니다. 자세한 작성 방법은 `docs/authoring-guide.md`를 참고하세요.

Three.js나 웹게임은 독립 앱으로 빌드한 뒤 `/play/` 아래에 연결할 수 있도록 사이트와 콘텐츠 구조를 분리했습니다.

기존 Jekyll 파일은 마이그레이션 검증과 롤백을 위해 임시로 남아 있지만 Astro 빌드 및 Docker 컨텍스트에서는 제외됩니다.
