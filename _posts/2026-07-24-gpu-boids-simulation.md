---
title: "GPU Boids Simulation"
date: 2026-07-24 09:00:00 +0900
categories: [Portfolio]
tags: [C#, Unity, HLSL, ComputeShader, GPU]
description: "Tiled N-body, double buffering, indirect instancing으로 구현한 대규모 GPU 군집 시뮬레이션"
image:
  path: /assets/img/projects/gpu-boids/cover.png
  alt: GPU Boids simulation
thumbnail: /assets/img/projects/gpu-boids/thumb.webp
stack: "C# · Unity · HLSL · Compute Shader"
project_order: 2
project_group: graphics
portfolio: true
toc: true
---

Craig Reynolds의 Boids 알고리즘을 Unity Compute Shader로 구현한 대규모 군집 시뮬레이션입니다.

Boids의 상태와 계산 결과를 GPU 메모리에 유지하고, 시뮬레이션부터 렌더링까지 CPU readback 없이 처리하는 파이프라인을 구성했습니다.

<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/zoZexSNFHc8" title="GPU Boids Simulation" allowfullscreen></iframe>
</div>

## 목표와 문제

16,000개 보이드가 모든 이웃을 탐색하면 한 프레임에 약 2.56억 번의 거리 계산이 필요합니다. CPU 순차 처리로는 실시간성을 확보하기 어려워 이웃 탐색과 물리 적분을 GPU 병렬 작업으로 옮겼습니다.

## 렌더링 파이프라인

### Pass 1: ForceCS

각 GPU thread가 하나의 보이드를 담당해 separation, alignment, cohesion을 계산합니다.

- 256개 보이드를 하나의 tile로 구성
- tile 데이터를 groupshared memory에 캐싱
- 연속된 thread가 연속된 주소를 읽는 coalesced access 구성
- 결과는 별도의 force buffer에 기록

```hlsl
groupshared BoidData tile[256];

for (uint block = 0; block < tileCount; ++block)
{
    tile[groupIndex] = boids[block * 256 + groupIndex];
    GroupMemoryBarrierWithGroupSync();
    // separation, alignment, cohesion
    GroupMemoryBarrierWithGroupSync();
}
```

### Pass 2: IntegrateCS

누적된 힘으로 속도와 위치를 갱신합니다. 최대 조향력, 최대 속도, 벽 회피를 적용하고 Euler integration으로 다음 상태를 계산합니다.

Force pass와 integrate pass의 읽기/쓰기 buffer를 분리해 thread 간 data race를 방지했습니다. 프레임이 끝나면 두 boid buffer의 역할을 교체합니다.

### Pass 3–4: Indirect Rendering

ComputeBuffer를 material에 직접 연결하고 `Graphics.DrawMeshInstancedIndirect()`로 모든 보이드를 한 번의 draw call로 렌더링합니다.

CPU에서 위치 데이터를 가져오지 않으며, simulation 영역 전체를 하나의 bounds로 사용해 frustum culling에 필요한 CPU 계산도 제거했습니다.

## 해결한 문제

### O(n²) 이웃 탐색

각 보이드에 하나의 thread를 할당하고 tiled N-body 방식으로 global memory 접근을 줄였습니다. 256 thread group을 기준으로 보이드 수를 맞춰 범위 검사 branch도 제거했습니다.

### Read/Write 충돌

`ForceCS → IntegrateCS → Buffer Swap` 구조로 읽기와 쓰기 시점을 분리했습니다. 다른 thread의 갱신 전후 데이터가 섞이지 않아 시뮬레이션이 안정적으로 유지됩니다.

### CPU–GPU 전송 비용

`GetData()`를 사용하지 않고 vertex shader가 simulation buffer를 직접 읽도록 구성했습니다. 시뮬레이션과 렌더링 사이에 CPU 복사가 없습니다.

## 배운 점

- GPU 병렬 프로그래밍과 thread group 설계
- shared memory를 활용한 memory access 최적화
- double buffering을 이용한 data race 방지
- simulation과 rendering을 연결하는 GPU-only pipeline

[View source on GitHub](https://github.com/haelime/GPUBoidsSimulation)
