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

Craig Reynolds의 Boids 알고리즘을 Unity 컴퓨트 셰이더로 구현한 대규모 군집 시뮬레이션입니다.

보이드의 상태와 계산 결과를 GPU 메모리에 유지하고, 시뮬레이션부터 렌더링까지 CPU로 다시 읽어 오지 않고 처리하도록 구성했습니다.

<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/zoZexSNFHc8" title="GPU 보이드 군집 시뮬레이션" allowfullscreen></iframe>
</div>

## 목표와 문제

16,000개 보이드가 모든 이웃을 탐색하면 한 프레임에 약 2.56억 번의 거리 계산이 필요합니다. CPU 순차 처리로는 실시간성을 확보하기 어려워 이웃 탐색과 물리 적분을 GPU 병렬 작업으로 옮겼습니다.

## 렌더링 처리 흐름

### 1단계: ForceCS

각 GPU 스레드가 하나의 보이드를 담당해 분리, 정렬, 응집을 계산합니다.

- 256개 보이드를 하나의 타일로 구성
- 타일 데이터를 그룹 공유 메모리에 저장
- 연속된 스레드가 연속된 주소를 읽는 병합 메모리 접근 구성
- 결과는 별도의 힘 버퍼에 기록

```hlsl
groupshared BoidData tile[256];

for (uint block = 0; block < tileCount; ++block)
{
    tile[groupIndex] = boids[block * 256 + groupIndex];
    GroupMemoryBarrierWithGroupSync();
    // 분리, 정렬, 응집
    GroupMemoryBarrierWithGroupSync();
}
```

### 2단계: IntegrateCS

누적된 힘으로 속도와 위치를 갱신합니다. 최대 조향력, 최대 속도, 벽 회피를 적용하고 오일러 적분으로 다음 상태를 계산합니다.

`ForceCS`는 현재 보이드 상태를 읽고 별도의 힘 버퍼에 결과를 기록합니다. 이후 `IntegrateCS`가 힘을 읽어 각 보이드의 위치와 속도를 갱신합니다. 두 계산 단계의 실행 순서와 버퍼 역할을 분리해 다른 스레드가 갱신 중인 상태를 읽지 않도록 했습니다.

### 3단계와 4단계: 간접 렌더링

`ComputeBuffer`를 재질에 직접 연결하고 `Graphics.DrawMeshInstancedIndirect()`로 모든 보이드를 한 번의 그리기 호출로 렌더링합니다.

CPU에서 위치 데이터를 가져오지 않으며, 시뮬레이션 영역 전체를 하나의 경계 상자로 사용해 절두체 컬링에 필요한 CPU 계산도 제거했습니다.

## 해결한 문제

### O(n²) 이웃 탐색

각 보이드에 하나의 스레드를 할당하고 타일 기반 N-body 방식으로 전역 메모리 접근을 줄였습니다. 스레드 그룹당 256개를 기준으로 보이드 수를 맞춰 범위 검사 분기도 제거했습니다.

### 읽기와 쓰기 충돌

`BoidData 읽기 → Force 기록 → BoidData 적분` 구조로 읽기와 쓰기 시점을 분리했습니다. 모든 이웃 탐색이 끝난 다음 `IntegrateCS` 실행에서 자기 상태만 갱신하므로 갱신 전후 데이터가 섞이지 않습니다.

### CPU–GPU 전송 비용

`GetData()`를 사용하지 않고 정점 셰이더가 시뮬레이션 버퍼를 직접 읽도록 구성했습니다. 시뮬레이션과 렌더링 사이에 CPU 복사가 없습니다.

## 연산량 및 성능 프로파일링

`ForceCS`는 각 보이드가 전체 보이드를 확인하므로 한 프레임의 이웃 검사는 `N²`으로 증가합니다.

| 보이드 수 | 스레드 그룹 | 프레임당 쌍 검사 | 이전 단계 대비 |
| ---: | ---: | ---: | ---: |
| 1,024 | 4 | 1,048,576 | 1× |
| 2,048 | 8 | 4,194,304 | 4× |
| 4,096 | 16 | 16,777,216 | 4× |
| 8,192 | 32 | 67,108,864 | 4× |
| 16,384 | 64 | 268,435,456 | 4× |

`BoidBenchmarkRunner`를 추가해 위 규모를 자동 순회하도록 구성했습니다. 수직 동기화를 끄고 각 구간을 예열한 뒤 전체 프레임 시간의 중앙값과 95번째 백분위수, Unity가 제공하는 CPU 및 GPU 프레임 시간을 CSV로 기록합니다. 이 데이터를 `pair_checks` 증가율과 비교하면 병목이 이웃 탐색, 렌더링 또는 CPU 제출 비용 중 어디에서 커지는지 확인할 수 있습니다.

GPU 시간은 그래픽스 API와 실행 환경에 따라 수집되지 않을 수 있으므로, 같은 실행 빌드와 하드웨어에서 반복 측정하도록 했습니다.

## 배운 점

- GPU 병렬 프로그래밍과 스레드 그룹 설계
- 공유 메모리를 활용한 메모리 접근 최적화
- 2단계 버퍼 분리를 이용한 데이터 경합 방지
- 시뮬레이션과 렌더링을 연결하는 GPU 내부 처리 흐름

[GitHub에서 소스 보기](https://github.com/haelime/GPUBoidsSimulation)
