# 문서 작성 안내

이 저장소는 Jekyll Chirpy와 GitHub Pages로 포트폴리오를 게시합니다.

## 1. 글 작성

`_posts`에 다음 형식으로 파일을 만듭니다.

`YYYY-MM-DD-slug.md`

예시:

- `2026-04-06-first-post.md`
- `2026-04-06-daily-note.md`

다음 서식 중 하나를 사용합니다.

- `docs/templates/post-tech.md`
- `docs/templates/post-diary.md`

## 2. 소개 페이지 수정

`_tabs/about.md`를 수정합니다.

이 파일의 내용이 `/about/` 페이지에 표시됩니다.

## 3. 프로필 사진 변경

1. 이미지 파일을 `assets/img/`에 넣습니다.
2. `_config.yml`의 `avatar` 값을 설정합니다.

예시:

```yml
avatar: /assets/img/profile.jpg
```

사용 가능한 형식:

- `/assets/img/profile.jpg`
- `https://example.com/profile.png`

## 4. 사이트 소개 문구 변경

`_config.yml`에서 다음 값을 수정합니다.

```yml
title: "haeli.log"
tagline: "tech blog and diary"
description: "Notes on development and everyday life."
```

이 값은 사이트 정보와 미리보기에 표시됩니다.

## 5. 연락처 링크

`_config.yml`을 수정합니다.

```yml
social:
  name: haelime
  email: me@example.com
  links:
    - https://github.com/haelime
```

하단에 프로필 링크를 표시하지 않으려면 `links`를 비워 둡니다.

## 6. 문서 표현 원칙

- 가운뎃점을 사용하지 않습니다. 항목은 쉼표나 접속어로 연결합니다.
- 한글이 더 자연스러운 문장에서는 영어 표현을 한글로 씁니다.
- 함수명, 클래스명, API 이름과 같이 정확성이 필요한 코드 식별자는 원문을 유지합니다.

## 7. 게시

변경 사항을 커밋하고 GitHub에 올립니다.

Pages 게시 방식이 `GitHub Actions`로 설정되어 있으면 사이트가 자동으로 빌드되고 배포됩니다.
