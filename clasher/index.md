---
layout: page
title: Clasher
description: Unity 클라이언트와 Node.js 인증·매치메이킹, C# authoritative 전투 서버로 구성한 실시간 카드 전략 게임 포트폴리오
permalink: /clasher/
toc: true
comments: false
sitemap: false
noindex: true
---

<link rel="stylesheet" href="{{ '/assets/css/clasher-portfolio.css' | relative_url }}">

<div class="clasher-portfolio">
  <section class="clasher-hero" aria-labelledby="clasher-title">
    <div class="clasher-hero__content">
      <p class="clasher-eyebrow">Unity client · real-time game server</p>
      <h2 id="clasher-title">Clasher</h2>
      <p class="clasher-hero__lead">카드 한 장의 입력부터 서버 판정과 상태 동기화까지. Unity 클라이언트, 인증·매치메이킹, authoritative 전투 서버의 경계를 직접 설계한 1대1 전략 게임 프로젝트입니다.</p>
      <div class="clasher-tags" aria-label="기술 스택">
        <span class="clasher-tag">Unity 6.2</span>
        <span class="clasher-tag">C# · .NET 10</span>
        <span class="clasher-tag">Node.js · Express</span>
        <span class="clasher-tag">MySQL · Redis</span>
        <span class="clasher-tag">TCP · HTTP · WebSocket</span>
      </div>
    </div>
    <div class="clasher-arena" aria-hidden="true"></div>
  </section>

  <div class="clasher-metrics" aria-label="프로젝트 수치">
    <div class="clasher-metric"><strong>8</strong><span>커스텀 덱 슬롯</span></div>
    <div class="clasher-metric"><strong>4</strong><span>순환 전투 핸드</span></div>
    <div class="clasher-metric"><strong>5</strong><span>런타임 UI 언어</span></div>
    <div class="clasher-metric"><strong>3</strong><span>자동 빌드 변형</span></div>
  </div>

  <div class="clasher-status-row" aria-label="검증 상태">
    <span class="clasher-status">로컬 Unity 쇼케이스</span>
    <span class="clasher-status">GameServer Release 빌드</span>
    <span class="clasher-status--pending clasher-status">온라인 클라이언트 재통합 예정</span>
  </div>

  <div class="clasher-note">
    <strong>현재 상태</strong>
    <p>제출용 Unity 빌드는 외부 서버 없이 로비에서 전투 샌드박스까지 바로 실행됩니다. 인증·매치메이킹·전투 서버 구현은 별도 서비스로 복구해 빌드를 검증했으며, 현재 Unity 온라인 경로는 최신 로컬 클라이언트 구조에 맞춰 재통합하는 단계입니다.</p>
  </div>

  <h2>한 번의 카드 입력이 전투가 되기까지</h2>

  <div class="clasher-flow" role="list" aria-label="온라인 액션 처리 흐름">
    <div class="clasher-flow__node" role="listitem"><strong>01 · 인증</strong><small>bcrypt 계정 검증과 access/refresh token 회전</small></div>
    <div class="clasher-flow__node" role="listitem"><strong>02 · 매칭</strong><small>Redis 큐와 WebSocket 알림, 서명된 match ticket</small></div>
    <div class="clasher-flow__node" role="listitem"><strong>03 · 요청</strong><small>Unity는 카드 종류와 배치 좌표만 TCP로 전달</small></div>
    <div class="clasher-flow__node" role="listitem"><strong>04 · 판정</strong><small>서버가 중복·빈도·영역·비용·타깃 규칙 검사</small></div>
    <div class="clasher-flow__node" role="listitem"><strong>05 · 동기화</strong><small>승인된 유닛·스펠·타워·결과 상태를 브로드캐스트</small></div>
  </div>

  <h2>해결한 문제</h2>

  <div class="clasher-grid">
    <article class="clasher-card">
      <span class="clasher-card__index">01</span>
      <h3>로그인했다고 아무 방에나 들어갈 수 있는 문제</h3>
      <p>인증 서버가 room ID, player slot, 만료와 고유 ID를 담은 서명 티켓을 발급합니다. GameServer는 JWT 계정과 티켓 계정을 다시 대조하고, 레거시 직접 입장은 차단해 매칭 결과가 입장 권한이 되도록 만들었습니다.</p>
    </article>
    <article class="clasher-card">
      <span class="clasher-card__index">02</span>
      <h3>클라이언트 입력을 그대로 믿을 수 없는 문제</h3>
      <p>유닛·스펠 요청마다 세션 상태, request ID 중복과 rollback, rate limit, 카드 정의, 동적 배치 영역과 엘릭서를 서버가 순서대로 검증합니다. 클라이언트는 결과를 확정하지 않고 승인된 상태만 표현합니다.</p>
    </article>
    <article class="clasher-card">
      <span class="clasher-card__index">03</span>
      <h3>연결이 끊기면 현재 전투를 잃는 문제</h3>
      <p>20초의 재접속 유예를 두고 동일 플레이어 세션을 교체합니다. 복귀 시 남은 시간, 엘릭서, 타워 HP와 살아 있는 유닛 스냅샷을 보내 클라이언트가 전투 화면을 다시 구성할 수 있게 했습니다.</p>
    </article>
    <article class="clasher-card">
      <span class="clasher-card__index">04</span>
      <h3>씬 전환 중 필요한 에셋이 늦게 준비되는 문제</h3>
      <p>Addressables 로딩을 주입 가능한 backend로 감싸 진행률·완료·실패를 분리했습니다. 카드 데이터와 프리팹을 전투 씬 진입 전에 준비하고, 누락된 label에는 명시적 fallback을 적용합니다.</p>
    </article>
  </div>

  <h2>클라이언트 안의 게임플레이</h2>

  <p>로비에서 8장의 고유 덱을 편집하면 전투 시작 시 순서를 섞어 4장을 핸드에 배치합니다. 카드를 사용하면 다음 카드가 들어오고 사용한 카드는 큐 뒤로 돌아갑니다. 유닛 배치는 진영과 강을 기준으로 제한되며, 라인의 타워가 파괴되면 전진 가능 영역도 달라집니다.</p>

  <p>유닛은 type별 오브젝트 풀에서 꺼내 재사용하고, 카드 비용·표시 이름·프리팹·스프라이트는 데이터 카탈로그를 통해 연결합니다. 전투와 로비는 60/30 FPS 정책을 나누고, UI는 영어·스페인어·프랑스어·독일어·포르투갈어를 런타임에 전환합니다.</p>

  <div class="clasher-stack">
    <section class="clasher-stack__item">
      <h3>Unity Client</h3>
      <p>씬 상태, 덱·핸드 순환, 드래그 배치, 오브젝트 풀, Addressables, 반응형 UI와 다국어</p>
    </section>
    <section class="clasher-stack__item">
      <h3>Login & Matchmaking</h3>
      <p>Express, bcrypt, JWT 회전, Redis 매칭 큐·세션, WebSocket 알림, MySQL 전적 저장</p>
    </section>
    <section class="clasher-stack__item">
      <h3>Authoritative GameServer</h3>
      <p>.NET TCP 세션, 바이너리 프로토콜, 티켓 입장, 룸 시뮬레이션, 보안 규칙과 재접속 스냅샷</p>
    </section>
  </div>

  <h2>반복 가능한 빌드와 검증</h2>

  <div class="clasher-verification">
    <h3>검증된 결과</h3>
    <ul>
      <li>복구한 .NET 10 GameServer Release 빌드: 경고 0, 오류 0</li>
      <li>PC 16:9, PC 9:16, Android 9:16 빌드 변형과 PlayerSettings 자동 복원</li>
      <li>Addressables backend·다국어 fallback EditMode 테스트</li>
      <li>Addressables 진행률·씬 전환 후 덱 유지 PlayMode 테스트</li>
    </ul>
  </div>

  <p>다음 단계는 로컬과 온라인 실행을 공통 battle gateway 아래 묶고, 두 클라이언트의 로그인부터 결과 저장까지 자동 스모크 테스트로 고정하는 것입니다. 동시에 전장·배치 표시·결과 UI 같은 presentation hierarchy를 씬과 프리팹에 완전히 authoring해 Edit Mode와 런타임 구조를 일치시킬 계획입니다.</p>
</div>
