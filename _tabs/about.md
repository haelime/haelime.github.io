---
# the default layout is 'page'
icon: fas fa-info-circle
order: 4
---

<link rel="stylesheet" href="{{ '/assets/css/about-showcase.css' | relative_url }}">

<section class="gfx-hero" aria-labelledby="gfx-hero-title">
  <div class="gfx-hero__copy">
    <p class="gfx-kicker">C++ / Graphics / Game Tech</p>
    <h1 id="gfx-hero-title">Vulkan과 셰이더를 직접 만지며 렌더러를 만들어갑니다.</h1>
    <p class="gfx-lead">
      C++ 기반 게임 엔진 구조, Vulkan 렌더링 파이프라인, GLSL 셰이더 실험을 기록하는 개발자 포트폴리오 겸 블로그입니다.
    </p>
    <div class="gfx-actions" aria-label="Profile links">
      <a href="https://github.com/haelime" target="_blank" rel="noopener">GitHub</a>
      <a href="https://www.shadertoy.com/view/lffGRj" target="_blank" rel="noopener">Shadertoy</a>
    </div>
  </div>

  <div class="gfx-stage" data-about-showcase>
    <canvas class="gfx-stage__canvas" aria-label="Realtime renderer preview"></canvas>
    <div class="gfx-stage__hud" aria-hidden="true">
      <span data-gfx-frame>-- ms</span>
      <span data-gfx-fps>-- fps</span>
    </div>
    <div class="gfx-stage__toolbar" aria-label="Render view mode">
      <button type="button" class="is-active" data-gfx-mode="pbr">PBR</button>
      <button type="button" data-gfx-mode="normal">Normal</button>
      <button type="button" data-gfx-mode="wire">Wire</button>
    </div>
    <p class="gfx-stage__fallback" data-gfx-fallback>
      WebGL preview is unavailable in this browser.
    </p>
  </div>
</section>

## Profile

C++와 그래픽스 렌더링을 중심으로 게임 개발을 공부하고 있습니다. 직접 엔진과 렌더러를 만들면서, API 사용법보다 프레임이 어떤 데이터 흐름으로 완성되는지 이해하는 데 관심이 많습니다.

## Focus

- Vulkan renderer architecture
- Render graph와 frame orchestration
- GLSL/SPIR-V shader experiments
- C++ engine structure and tooling
- GPU debugging, synchronization, resource lifetime

## Stack

`C++` `Vulkan` `SDL` `GLSL` `SPIR-V` `CMake` `VMA` `RenderDoc` `Three.js`

## Current Project

개인 Vulkan 렌더러를 만들며 swapchain, command buffer, synchronization, render graph, shader pipeline을 단계별로 정리하고 있습니다. 블로그 글은 구현 과정에서 막혔던 개념과 설계 판단을 다시 설명할 수 있을 정도로 정리하는 것을 목표로 합니다.

## Shader Experiments

<section class="shader-grid" aria-label="Shadertoy works">
  <article class="shader-card">
    <div>
      <p class="shader-card__eyebrow">Shadertoy</p>
      <h3>Shadertoy Study 01</h3>
      <p>GLSL fragment shader experiment. More shader studies will be added here as they are published.</p>
    </div>
    <a href="https://www.shadertoy.com/view/lffGRj" target="_blank" rel="noopener">Open Shadertoy</a>
  </article>
</section>

<script type="module" src="{{ '/assets/js/about-showcase.js' | relative_url }}"></script>
