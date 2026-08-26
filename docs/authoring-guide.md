# 문서 작성 안내

이 저장소는 Astro 7과 GitHub Pages로 포트폴리오를 게시합니다.

## 1. 프로젝트 글 작성

`src/content/portfolio/`에 Markdown 파일을 만듭니다.

```text
YYYY-MM-DD-project-slug.md
```

`docs/templates/portfolio-project.md`의 frontmatter를 복사해 사용합니다. 파일명의 날짜는 정렬용이며 실제 표시 날짜는 `date` 필드입니다.

## 2. 프로젝트 목록 제어

- `project_group`: `games`, `graphics`, `general` 중 하나
- `project_order`: 그룹 안의 표시 순서
- `hide_from_home: true`: 홈에서만 제외하고 프로젝트 목록에는 표시
- `unlisted: true`: URL은 만들지만 모든 목록과 분류 페이지에서 제외
- `noindex: true`: 검색 엔진 색인 방지
- `sitemap: false`: 사이트맵 제외
- `permalink: /custom-path/`: 기본 `/posts/<파일명>/` 대신 사용할 URL

Clasher가 링크로만 접근 가능한 구성의 예시입니다.

## 3. 이미지

공개 이미지는 `public/assets/img/projects/<project>/`에 넣고 Markdown에서 다음처럼 참조합니다.

```markdown
![설명](/assets/img/projects/example/screenshot.png)
```

포트폴리오 본문의 단독 이미지는 데스크톱에서 화면 너비의 50%, 모바일에서 100%로 표시됩니다.

## 4. 페이지와 프로필

- 홈: `src/pages/index.astro`
- 소개: `src/pages/about.md`
- 이력: `src/pages/resume.md`
- 프로젝트 목록: `src/pages/projects.astro`
- 공통 레이아웃: `src/layouts/BaseLayout.astro`
- 프로필 사진: `public/assets/img/IMG_8923.jpg`

## 5. Three.js와 웹게임

짧은 Three.js 데모는 Astro 컴포넌트로 만들고, 규모가 큰 게임은 독립 Vite 앱으로 빌드해 `/play/<game>/` 링크나 iframe으로 연결합니다. Unity WebGL 빌드는 저장소 용량과 응답 헤더를 고려해 별도 호스팅을 권장합니다.

## 6. 로컬 확인

```bash
npm run dev
```

Docker:

```bash
docker compose up --build
```

## 7. 게시 전 검증

```bash
npm run build
```

빌드가 통과하면 `main`에 반영된 변경을 GitHub Actions가 GitHub Pages에 배포합니다.
