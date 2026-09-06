---
title: Flappy Boids
date: 2026-08-28 20:00:00 +0900
categories:
  - Portfolio
tags:
  - C#
  - Unity
  - Burst
  - Procedural Generation
description: 물고기 무리를 조종하는 3D Flappy Bird
thumbnail: /assets/img/projects/flappy-boids/thumbnail.jpg
stack: C# · Unity 6 · Burst · URP · Marching Cubes
period: 2026.08.26–2026.08.28
repository: https://github.com/haelime/FlappyBoids
project_order: 4
project_group: games
hide_from_home: true
portfolio: true
toc: true
---
<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/UZPNwhEVvLM" title="Flappy boids 게임플레이" allowfullscreen></iframe>
</div>
Unity 6과 DOTS로 제작한 3D Flappy Bird 게임입니다.

## What

Boids 움직임에 매력을 느껴, 게임엔 어떻게 적용하면 좋을까 고민하다, 사이드 프로젝트로 제작하게 되었습니다.

Boid 데이터를 연속된 메모리에 배치해 cache locality와 병렬 처리 효율을 높이기 위해, gameObject 중심 구조 대신 Unity DOTS를 적용했습니다.

Cube로는 복잡한 굴곡의 바닷속을 표현하기 어렵다고 판단해 Marching cubes 알고리즘으로 벽면과 바닥 에셋을 생성해 사용했습니다.


[GitHub](https://github.com/haelime/FlappyBoids)
