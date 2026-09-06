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
Sebastian Lague의 [Coding Adventure: Boids](https://www.youtube.com/watch?v=bqtqltqcQhw) 영상에서 영감을 받아 시작한 프로젝트입니다.

## Boid의 움직임 이해하기

**주변 개체에 반응하는 세 가지 규칙을 GPU에서 계산하고, 물고기 군집과 게임에 활용.** Boids는 각 개체가 이웃을 기준으로 움직이면서 군집을 만드는 알고리즘임.

- **분리:** 너무 가까운 이웃에게서 멀어짐.
- **정렬:** 주변 이웃의 이동 방향에 맞춤.
- **응집:** 주변 이웃의 중심으로 모임.

GPU Boids에서는 이웃 탐색과 상태 갱신의 데이터 흐름을, Coral reef에서는 군집이 있는 수중 장면의 빛과 거리감을 구현했음. Flappy Boids는 물고기 무리를 직접 조작하는 게임으로 적용한 사례.

## GPU Boids, 군집 계산 구현

**군집 상태의 계산부터 렌더링까지 GPU 메모리 안에서 연결.** 타일 단위로 이웃 데이터를 공유하고, 힘 계산과 상태 갱신을 분리해 갱신 전후의 데이터가 섞이지 않도록 구성했음.

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/zoZexSNFHc8" title="GPU Boids 군집 시뮬레이션 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=zoZexSNFHc8">GPU Boids 영상</a></figcaption>
</figure>

Craig Reynolds의 Boids 규칙을 compute shader로 구현함. 각 개체는 주변 이웃에서 조향력을 구한 뒤 속도와 위치를 갱신하고, 렌더링은 갱신한 상태를 직접 읽는 흐름.

### 이웃 데이터를 타일로 공유

개체마다 GPU 스레드를 할당하고, 이웃 데이터 256개를 그룹 공유 메모리에 올려 재사용하도록 구성했음. 각 스레드가 같은 데이터를 전역 메모리에서 반복해서 읽는 비용을 줄이기 위한 처리.

공유 데이터를 읽기 전과 다음 타일로 교체하기 전에 동기화해, 계산 중인 데이터가 덮어써지지 않도록 했음.

**타일링으로 줄인 것은 메모리의 반복 읽기이며, 전체 이웃 검사의 O(N²)은 유지됨.** 16,384개를 전체 탐색하면 프레임당 쌍 검사는 268,435,456회. GPU에 옮겨 병렬 처리해도 개체 수가 두 배면 검사량은 네 배가 되는 구조임.

### 힘 계산과 상태 갱신을 분리

**모든 조향력을 계산한 뒤 위치와 속도를 갱신하도록 두 단계를 분리.** 이웃을 읽는 도중 다른 스레드가 위치를 바꾸면 이전 상태와 다음 상태가 섞일 수 있기 때문.

1. **ForceCS:** 현재 위치와 속도를 읽어 조향력을 별도 힘 버퍼에 기록.
2. **IntegrateCS:** 이웃 탐색이 끝난 뒤 힘 버퍼를 읽어 각 개체의 속도와 위치를 갱신. 최대 조향력, 최대 속도와 벽 회피를 적용하고 다음 상태를 계산함.

각 스레드가 자기 상태만 쓰더라도 다른 스레드가 그 상태를 읽는 중일 수 있음. 힘 버퍼와 실행 단계를 나눠 이 읽기와 쓰기 시점을 구분했음.

### CPU로 복사하지 않고 렌더링에 연결

갱신한 <code>ComputeBuffer</code>를 재질에 연결해 정점 셰이더가 위치와 속도를 직접 읽도록 구성함. <code>GetData()</code>를 통한 CPU 복사를 거치지 않고, <code>Graphics.DrawMeshInstancedIndirect()</code>로 군집을 그리도록 연결했음.

시뮬레이션 영역 전체를 하나의 bounds로 사용해 개체별 CPU 경계 갱신도 피함. 대신 개별 보이드 단위의 세밀한 컬링은 제공하지 않으며, 이 구조가 전체 프레임을 얼마나 줄였는지는 별도 측정이 필요함.

<code>BoidBenchmarkRunner</code>로 개체 수에 따른 프레임 시간을 수집하도록 구성했음. 아래 표는 계산한 검사량이고, 실제 성능 비교 결과는 아직 문서에 포함하지 않았음.

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

위 규모를 순회하며 수직 동기화를 끄고 예열한 뒤, 전체 프레임 시간의 중앙값과 95번째 백분위수 및 수집 가능한 CPU/GPU 시간을 CSV로 기록함. GPU 시간 수집 여부는 그래픽스 API와 실행 환경에 따라 달라지므로 같은 하드웨어, build와 장면 조건에서 비교해야 함.

</details>

[GPU Boids 소스 코드](https://github.com/haelime/GPUBoidsSimulation)

## Coral reef, 수중 장면에 활용

**GPU 물고기 군집이 있는 장면에 거리, 그림자와 시선에 반응하는 수중 표현을 구현.** 가까운 산호의 색과 먼 배경의 가시성을 구분하고, 산호에 가려진 햇빛이 물속 산란에도 반영되도록 했음.

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/ohuVXfWt2A4" title="Coral reef 수중 렌더링 데모 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=ohuVXfWt2A4">Coral reef 영상</a></figcaption>
</figure>

물고기 군집을 수중 환경의 일부로 사용한 렌더링 데모. 군집의 이동 규칙에 더해 주변 공간의 빛과 거리감을 표현하는 데 집중했음.

### 거리와 그림자를 반영하는 빛

물체에서 오는 빛의 감쇠와 물속에서 더해지는 산란광을 나누어 계산함. 기존의 밝은 광선 기둥이 산호의 그림자와 연결되지 않아, 독립된 발광 물체처럼 보이는 문제를 다루기 위한 변경.

URP의 opaque texture에서 장면 색을, depth texture에서 월드 위치와 거리를 얻어 다음과 같이 처리했음.

- **RGB 감쇠와 backscatter:** Beer-Lambert 감쇠로 멀리 있는 물체의 신호를 줄이고, 거리별로 물의 산란색을 더함.
- **햇빛 산란:** 시선 경로의 16개 지점에서 그림자와 투과율을 합산. 가려진 지점의 기여가 줄어들어 산호의 그림자와 물속 밝기가 연결됨.
- **산란 방향:** Henyey-Greenstein 위상 함수로 광원과 시선 방향에 따른 밝기를 반영.

<details>
<summary>RGB 감쇠와 햇빛 산란의 수식</summary>

#### RGB 감쇠와 backscatter

물속을 통과하는 거리를 $d$, 경로 중간점에서 구한 상대 밀도를 $\rho$라 하면, 셰이더는 유효 거리 $D=\rho d$를 사용함. RGB 각 채널 $c$의 투과율과 배경 산란광은 다음과 같이 계산함.

$$
\begin{aligned}
T_c(D) &= e^{-\beta_c D} \\
L_{\mathrm{base},c} &= L_{\mathrm{scene},c}T_c(D)
  + B_c\left(1-e^{-\gamma_c D}\right)
\end{aligned}
$$

$\beta_c$는 직접광 감쇠 계수, $\gamma_c$는 backscatter 감쇠 계수, $B_c$는 물속 배경 산란색임. 거리가 길어질수록 물체에서 오는 신호는 줄고 배경 산란색의 비중은 커짐. 채널마다 계수가 달라 거리별 색 변화도 표현할 수 있음.

위 식은 직접 신호와 backscatter의 합성을 나타냄. 실제 셰이더는 거리별 흐림을 적용한 장면 색을 사용하고, 여기에 햇빛 산란과 caustics 등을 더함. 밀도는 경로 전체를 적분하는 대신 중간점의 값으로 근사했음.

#### 그림자를 따르는 햇빛 산란

산란 방향에 따른 밝기는 Henyey-Greenstein 위상 함수로 계산함.

$$
p_g(\mu)=
\frac{1-g^2}
{4\pi\left(1+g^2-2g\mu\right)^{3/2}}
$$

$g$는 산란의 방향성을 조절하는 값이고, $\mu$는 카메라에서 장면으로 향하는 방향과 샘플에서 광원으로 향하는 방향의 내적임. 이 방향 정의에서 $g>0$이면 광원 쪽을 바라볼수록 산란이 강해짐. 구현에서는 분모 괄호의 값을 최소 0.01로 제한해 지나치게 큰 값을 방지함.

햇빛 산란은 시선 경로의 샘플마다 **그림자 가시성 × 두 광 경로의 투과율 × 샘플 간격**을 누적함. 색과 강도 계수를 $K_c$로 묶으면 다음과 같이 표현할 수 있음.

$$
L_{\mathrm{sun},c}\approx
K_c\,p_g(\mu)
\sum_{i=0}^{N-1}
V_i\,e^{-\beta_c(\rho s_i+\ell_i)}\,\Delta s
$$

$s_i$는 카메라에서 샘플까지의 거리, $\ell_i$는 수면에서 샘플까지 햇빛이 이동한 거리, $V_i$는 shadow map에서 얻은 가시성임. $K_c$에는 광원색, 산란색과 강도, 밀도 및 backscatter 계수가 포함됨. 그림자에 가려진 샘플은 기여가 줄어들므로 산호의 그림자와 물속 밝기가 연결됨.

현재 설정은 $N=16$이며 $\Delta s=\min(d,80)/N$으로 구간을 나눔. 시선이 수면을 만나면 물속 구간을 거기서 끝내고, 샘플 위치에는 jitter를 적용함. 전체 다중 산란을 푸는 방식이 아닌 단일 산란의 이산 근사임.

</details>

![동일한 카메라에서 수중 셰이더를 단계별로 적용한 비교](/assets/img/projects/point-nemo/point-nemo-shader-breakdown.gif)

수면, RGB 감쇠, 산란과 환경 합성을 순서대로 추가한 비교. 카메라와 셰이더 시간을 고정한 정지 캡처이며, 실제 움직임은 위 Coral reef 영상으로 제시함. 현재 구도에서 ON/OFF 차이가 검출되지 않은 바닥 caustics 단계는 제외했음.

### 파랗게 뭉개지는 모래 바닥 수정

**바닥의 depth 입력을 수정해 가까운 모래가 먼 배경처럼 처리되는 문제를 해결.** 밝은 재질을 적용해도 수중 효과를 켜면 바닥이 파랗게 뭉개져, 재질색과 깊이 입력을 나누어 확인했음.

1. 수중 효과 ON/OFF와 깊이 값 시각화로 어느 단계에서 화면이 달라지는지 확인.
2. 바닥 셰이더가 SSAO의 깊이/법선 prepass에 참여하도록 <code>DepthNormals</code> 패스 추가.
3. 첫 캡처에서만 나타나는 검은 바닥은 카메라 예열로 분리해 처리.

수정 후 가까운 모래의 색과 깊이 처리가 함께 표시되는 것을 확인했음. 패스의 존재와 opaque texture 설정을 회귀 검사 대상으로 남김.

### 시선과 표면에 맞춰 수면과 caustics 표현

수면을 보는 각도에 따라 하늘이 보이는 영역과 반사가 강한 영역을 구분함. Gerstner 파도에 Fresnel 계산과 전반사 조건을 적용하고, 물속 입사각이 약 48.6도 이상이면 전반사하도록 처리했음.

caustics는 표면 방향, 수심과 주광원 그림자에 따라 강도를 조절함. 원래 표면색과 투과율을 곱해 더하므로 어두운 표면과 그늘까지 같은 밝기로 빛나는 것을 피할 수 있음. 반사는 환경색 근사이며, caustics는 광자 추적이 아닌 해석적 무늬 계산임.

<details>
<summary>전반사 조건과 caustics의 수식</summary>

#### 수면의 굴절과 전반사

수면 법선에서 잰 물속 입사각을 $\theta_i$, 공기 쪽 굴절각을 $\theta_t$라 하면 Snell의 법칙은 다음과 같음.

$$
\begin{aligned}
n_w\sin\theta_i &= n_a\sin\theta_t \\
\theta_{\mathrm{crit}}
&=\arcsin\left(\frac{n_a}{n_w}\right)
\approx 48.6^\circ
\end{aligned}
$$

셰이더는 물의 굴절률 $n_w=1.333$, 공기의 굴절률 $n_a=1$을 사용함. 물속 입사각이 임계각 이상이면 투과가 사라지고 전반사가 일어나도록 처리함. 이 경계가 수중에서 하늘을 볼 수 있는 Snell window를 만듦.

임계각 아래에서는 두 편광의 Fresnel 반사율을 평균해 반사와 투과를 혼합함. 물 위에서 보는 경우에는 Schlick 근사를 사용하며, 파도 법선이 바뀌면 같은 시선에서도 반사 비율이 달라짐.

#### 표면과 그림자를 따르는 caustics

물결 무늬는 두 개의 움직이는 간섭 패턴으로 근사하고, 받는 표면의 방향과 수심으로 강도를 조절함. 셰이더의 곱셈 구조를 정리하면 다음과 같음.

$$
A(\mathbf{x},t)=
P(\mathbf{x},t)\,
\max(0,\mathbf{n}\cdot\mathbf{l})\,
e^{-0.035h}\,V(\mathbf{x})\,F(r)\,M\,S
$$

$P$는 해석적 무늬, $\mathbf{n}$은 depth에서 복원한 표면 법선, $\mathbf{l}$은 광원 방향, $h$는 수심임. $V$는 그림자 가시성, $F$는 카메라 거리 $r$에 따른 감쇠, $M$은 수중 geometry 마스크, $S$는 조절 가능한 강도임.

caustics 기여는 원래 표면색에 $A$와 caustics 색, 카메라까지의 투과율을 곱해 더함. 따라서 어두운 표면과 그늘까지 같은 밝기로 빛나는 것을 피할 수 있음. 광자의 굴절 경로를 추적해 집광을 계산하는 물리 시뮬레이션은 아님.

</details>

### 씬 설정과 확인 범위

산호 배치와 광학 설정은 씬에 저장하고, 베이크 시 재질과 런타임 컴포넌트의 계수를 동기화함. 런타임은 저장된 시각 객체의 상태를 갱신하도록 구성했음. Play Mode에서 계층이 늘어나지 않고 광학 값이 유지되는 것을 확인함.

화면 비교와 장면 동작은 확인했으며, GPU frame time과 메모리 비교는 아직 측정하지 않았음. 특히 전체 해상도에서 수행하는 16회 산란 샘플링의 비용은 별도 확인이 필요함.

산호는 Smithsonian CC0/Open Access 스캔, 물고기와 일부 환경 소품은 Kenney 에셋을 사용했으며 직접 모델링한 작업에 포함하지 않음. 코드 수정, 씬 베이크, 진단과 테스트 실행에는 AI 코딩 도구를 활용했으며, 개인 설계와 검증 범위는 정리 중임.

[Coral reef 소스 코드](https://github.com/haelime/Point-nemo)

## Flappy Boids, 조작하는 게임으로 활용

**물고기 무리를 조종하는 3D Flappy Bird.** Boids의 움직임을 직접 조작하는 게임으로 만들어 보고자 Unity 6과 DOTS로 제작했음.

<figure>
  <div class="ratio">
    <iframe src="https://www.youtube.com/embed/UZPNwhEVvLM" title="Flappy Boids 게임플레이 영상" loading="lazy" allowfullscreen></iframe>
  </div>
  <figcaption><a href="https://www.youtube.com/watch?v=UZPNwhEVvLM">Flappy Boids 영상</a></figcaption>
</figure>

### 군집 데이터와 플레이 공간 구성

보이드 데이터를 연속된 메모리에 배치해 cache locality와 병렬 처리 효율을 높이려는 목적으로 DOTS를 적용했음. 이 프로젝트에서는 compute shader와 별도의 실행 구조로 군집 움직임을 게임에 연결함.

바닷속 벽과 바닥은 Marching Cubes로 환경 에셋을 생성해 굴곡을 표현했음. 군집 계산의 구현에서 나아가, 물고기 무리가 움직이는 공간과 조작 가능한 플레이를 구성한 사례.

[Flappy Boids 소스 코드](https://github.com/haelime/FlappyBoids)
