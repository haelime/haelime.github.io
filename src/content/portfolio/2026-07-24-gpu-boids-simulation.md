---
title: Boids!
date: 2026-07-24 09:00:00 +0900
categories:
  - Portfolio
tags:
  - C#
  - Unity
  - HLSL
  - ComputeShader
  - GPU
description: Boid의 이해와 활용
thumbnail: /assets/img/projects/point-nemo/point-nemo-shader-breakdown.gif
stack: C#, Unity, HLSL, Compute Shader, DOTS, URP
project_order: 2
project_group: graphics
portfolio: true
toc: true
---

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/ohuVXfWt2A4" title="Coral reef 수중 렌더링 데모 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=ohuVXfWt2A4">Coral reef 영상</a></figcaption>
</figure>

<nav aria-label="Boids 프로젝트 본문 바로가기">
  <ul>
    <li><a href="#gpu-boids">GPU Boids, 군집 계산과 렌더링</a></li>
    <li><a href="#coral-reef">Coral reef, 수중 장면 표현</a></li>
    <li><a href="#flappy-boids">Flappy Boids, 조작 가능한 게임으로 적용</a></li>
  </ul>
</nav>

**Boids의 군집 움직임을 계산하고, 수중 장면으로 표현하고, 게임에 적용한 세 프로젝트.** GPU 시뮬레이션의 데이터 흐름부터 빛과 그림자가 있는 수중 환경, 플레이어가 조작하는 물고기 무리까지 각각의 구현을 정리함.

## GPU Boids

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/zoZexSNFHc8" title="GPU Boids 군집 시뮬레이션 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=zoZexSNFHc8">GPU Boids 영상</a></figcaption>
</figure>

Craig Reynolds의 Boids 규칙을 compute shader로 구현한 군집 시뮬레이션. 위치와 속도를 GPU 메모리에 유지하고, 계산 결과를 CPU로 다시 읽어 오지 않고 렌더링까지 연결했음.

### 전체 이웃 탐색을 GPU에서 처리

각 보이드가 모든 개체를 확인하면 검사 수는 N²으로 증가함. 16,384개 기준 프레임당 268,435,456회의 쌍 검사가 필요하므로, 개체마다 GPU 스레드를 할당해 분리, 정렬과 응집을 계산했음.

이웃 데이터를 256개씩 그룹 공유 메모리에 올리고 같은 타일을 스레드들이 재사용하도록 구성함. 타일을 읽기 전과 교체하기 전에 동기화해 계산 도중 데이터가 덮어써지지 않도록 했음. 전역 메모리의 반복 읽기를 줄이는 방식이며, 전체 탐색의 O(N²) 연산량은 유지됨.

### 힘 계산과 상태 갱신을 분리

이웃을 읽는 도중 다른 스레드가 위치를 바꾸면 이전 상태와 다음 상태가 섞일 수 있음. 이를 피하기 위해 두 단계로 나누었음.

1. **ForceCS:** 현재 위치와 속도를 읽어 조향력을 별도 힘 버퍼에 기록.
2. **IntegrateCS:** 이웃 탐색이 끝난 뒤 힘 버퍼를 읽어 각 개체의 속도와 위치를 갱신. 최대 조향력, 최대 속도와 벽 회피를 적용하고 다음 상태를 계산함.

### 시뮬레이션 버퍼를 렌더링에서 직접 읽기

<code>ComputeBuffer</code>를 재질에 연결하고, 정점 셰이더가 보이드 상태를 직접 읽도록 구성함. <code>GetData()</code>로 위치를 복사하지 않고 <code>Graphics.DrawMeshInstancedIndirect()</code>로 군집을 그리도록 연결했음.

시뮬레이션 영역 전체를 하나의 bounds로 사용해 개체별 CPU 경계 갱신을 피했으며, 개별 보이드 단위의 세밀한 컬링은 이 방식에서 제공하지 않음.

<details>
<summary>규모별 연산량과 벤치마크 수집 방식</summary>

| 보이드 수 | 스레드 그룹 | 프레임당 쌍 검사 |
| ---: | ---: | ---: |
| 1,024 | 4 | 1,048,576 |
| 2,048 | 8 | 4,194,304 |
| 4,096 | 16 | 16,777,216 |
| 8,192 | 32 | 67,108,864 |
| 16,384 | 64 | 268,435,456 |

표는 N²으로 계산한 작업량이며 성능 측정값은 아님. 현재 구현은 개체 수를 256개 단위의 스레드 그룹 크기에 맞추는 조건을 사용함.

<code>BoidBenchmarkRunner</code>는 위 규모를 순회하며 수직 동기화를 끄고 예열한 뒤, 전체 프레임 시간의 중앙값과 95번째 백분위수 및 수집 가능한 CPU/GPU 시간을 CSV로 기록함. 실제 측정 결과는 아직 이 문서에 포함하지 않았으며, GPU 시간 수집 여부는 그래픽스 API와 실행 환경에 따라 달라짐.

</details>

[GPU Boids 소스 코드](https://github.com/haelime/GPUBoidsSimulation)

## Coral reef

GPU 물고기 군집과 산호가 있는 장면에 **거리, 그림자와 시선에 반응하는 수중 표현**을 구현한 렌더링 데모. 가까운 산호의 색과 먼 배경의 가시성을 구분하고, 햇빛이 가려지는 위치를 물속 산란에 반영했음.

### 거리와 그림자를 반영하는 빛

기존의 밝은 광선 기둥이 산호의 그림자와 연결되지 않아 독립된 발광 물체처럼 보였음. 물체에서 오는 빛의 감쇠와 물속에서 더해지는 산란광을 구분해 이 관계를 표현했음.

URP의 opaque texture와 depth texture에서 장면 색과 거리를 얻고, RGB별 Beer-Lambert 감쇠와 backscatter를 계산함. 시선 경로의 16개 지점에서 햇빛의 그림자와 감쇠를 평가하고, Henyey-Greenstein 위상 함수로 빛과 시선 방향의 관계를 반영했음.

![동일한 카메라에서 수중 셰이더를 단계별로 적용한 비교](/assets/img/projects/point-nemo/point-nemo-shader-breakdown.gif)

수면, RGB 감쇠, 산란과 환경 합성을 순서대로 추가한 비교. 카메라와 셰이더 시간을 고정한 정지 캡처이며, 실제 움직임은 상단 영상으로 제시함. 현재 구도에서 ON/OFF 차이가 검출되지 않은 바닥 카우스틱 단계는 제외했음.

### 파랗게 뭉개지는 모래 바닥 수정

가까운 모래가 먼 배경처럼 파랗게 처리되는 문제는 수중 효과 ON/OFF와 깊이 값 시각화로 추적했음. 바닥 셰이더에 SSAO의 깊이/법선 prepass에 참여하는 <code>DepthNormals</code> 패스를 추가하고, 첫 캡처의 검은 바닥은 카메라 예열로 분리해 처리함.

이후 가까운 모래의 색과 깊이 처리가 함께 표시되는 것을 확인하고, 패스의 존재와 opaque texture 설정을 회귀 검사 대상으로 남겼음.

### 수면과 장면 설정 연결

Gerstner 파도에 프레넬 계산과 전반사 조건을 적용해, 수면을 보는 각도에 따라 하늘이 보이는 영역과 반사가 강한 영역을 구분함. 카우스틱은 표면 방향, 수심과 주광원 그림자에 따라 강도를 조절했음. 반사는 환경색 근사이며 카우스틱은 해석적 무늬 계산임.

산호 배치와 광학 설정은 씬에 저장하고, 베이크 시 재질과 런타임 컴포넌트의 계수를 동기화함. 런타임에는 저장된 시각 객체의 상태를 갱신하도록 구성했으며, Play Mode에서 계층이 늘어나지 않고 광학 값이 유지되는 것을 확인했음.

GPU frame time과 메모리 비교는 아직 측정하지 않았음. 산호는 Smithsonian CC0/Open Access 스캔, 물고기와 일부 환경 소품은 Kenney 에셋을 사용했으며 직접 모델링한 작업에 포함하지 않음. 코드 수정, 씬 베이크, 진단과 테스트 실행에는 AI 코딩 도구를 활용했으며, 개인 설계와 검증 범위는 정리 중임.

[Coral reef 소스 코드](https://github.com/haelime/Point-nemo)

## Flappy Boids

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/UZPNwhEVvLM" title="Flappy Boids 게임플레이 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=UZPNwhEVvLM">Flappy Boids 영상</a></figcaption>
</figure>

Boids의 움직임을 직접 조작하는 게임으로 만들어 보고자 제작한 **물고기 무리를 조종하는 3D Flappy Bird**. Unity 6과 DOTS로 군집 데이터를 구성했음.

### 군집 데이터와 플레이 공간 구성

반복 처리하는 보이드 데이터를 연속된 메모리에 배치해 cache locality와 병렬 처리 효율을 높이려는 목적으로 DOTS를 적용했음. 앞의 compute shader 프로젝트와 별도로, 이 프로젝트에서는 군집 움직임을 게임에 사용하는 데 초점을 맞춤.

바닷속 벽과 바닥의 복잡한 굴곡은 Marching Cubes로 환경 에셋을 생성해 표현했음. 군집을 조작하는 플레이와 함께, 물고기가 움직일 수중 공간을 구성한 프로젝트임.

[Flappy Boids 소스 코드](https://github.com/haelime/FlappyBoids)
