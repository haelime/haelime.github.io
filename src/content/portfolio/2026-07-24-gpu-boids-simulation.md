---
title: "GPU 보이드 군집 시뮬레이션"
date: 2026-07-24 09:00:00 +0900
categories: [Portfolio]
tags: [C#, Unity, HLSL, ComputeShader, GPU]
description: "타일 기반 N-body, 2단계 버퍼 분리, 간접 인스턴싱으로 구현한 대규모 GPU 군집 시뮬레이션"
image:
  path: /assets/img/projects/gpu-boids/cover.png
  alt: GPU 보이드 군집 시뮬레이션
thumbnail: /assets/img/projects/gpu-boids/thumb.webp
stack: "C#, Unity, HLSL, 컴퓨트 셰이더"
project_order: 2
project_group: graphics
portfolio: true
toc: true
---

Craig Reynolds의 Boids 알고리즘을 compute shader로 구현한 군집 simulation임.

보이드 상태와 계산 결과를 GPU memory에 유지해 simulation부터 rendering까지 CPU readback 없이 처리했음.

<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/zoZexSNFHc8" title="GPU 보이드 군집 시뮬레이션" allowfullscreen></iframe>
</div>

## 연속 메모리 기반 Neighbor Search

GameObject 중심 구조 대신 Unity DOTS와 tiled N-body compute를 적용해 대규모 보이드의 이웃 탐색을 병렬화했음.

### Why?

- 각 보이드가 모든 이웃을 확인하므로 개체 수가 두 배가 될 때 pair check는 네 배로 증가했음.
- 개별 GameObject에 상태와 update를 나누면 data가 흩어져 cache locality와 batch 처리에 불리했음.
- 모든 이웃을 GPU global memory에서 반복해서 읽으면 compute shader에서도 memory access가 병목이 될 수 있었음.

### How?

- GameObject와 MonoBehaviour 중심 구조는 배제하고 Unity DOTS로 Boid data를 연속 배치했음.
- 각 보이드에 GPU thread 하나를 배정하고 neighbor search를 compute shader로 옮겼음.
- global memory를 매번 직접 읽는 방식은 배제하고 256개 단위 tile을 group shared memory에 올려 재사용했음.

### Solution

- `ForceCS`가 tile을 읽고 `GroupMemoryBarrierWithGroupSync()` 뒤 group 내부에서 공유하도록 구성했음.
- 16,384개 기준 64개 thread group이 268,435,456회 pair check를 수행하도록 구성했음.
- 전후 성능 수치는 측정하지 않았으며, VSync을 끄고 warm-up 후 frame time median/P95와 Unity CPU/GPU time을 CSV로 기록하도록 했음.

[GitHub에서 소스 보기](https://github.com/haelime/GPUBoidsSimulation)
