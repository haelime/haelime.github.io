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
project_order: 2
project_group: games
portfolio: true
toc: true
---
<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/UZPNwhEVvLM" title="Flappy boids 게임플레이" allowfullscreen></iframe>
</div>
Unity 6과 DOTS로 제작한 3D Flappy Bird 게임입니다.

Boids 움직임에 매력을 느껴 만들기 시작했고, boids data의 cache hit 등 최적화를 신경쓰기 위해 DOTS를 적용해 개발했습니다.

Cube로는 복잡한 굴곡의 바닷속을 표현하기 어렵다고 판단해 Marching cubes 알고리즘으로 벽면과 바닥 에셋을 생성해 사용했습니다.


[GitHub](https://github.com/haelime/FlappyBoids)
