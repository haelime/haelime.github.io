---
title: "Point Nemo, 수중 렌더링 데모"
date: 2026-09-05 12:00:00 +0900
categories: [Portfolio]
tags: [Unity, URP, HLSL, Rendering]
description: "거리별 RGB 감쇠, 그림자 기반 산란, 수면 광학을 결합한 열대 산호 수중 렌더링 데모"
thumbnail: /assets/img/projects/point-nemo/09_final_with_fish_and_particles.png
stack: "Unity 6, URP 17.6, C#, HLSL"
repository: https://github.com/haelime/Point-nemo
project_order: 5
project_group: graphics
portfolio: true
unlisted: true
noindex: true
sitemap: false
toc: true
---

> 포트폴리오 초안이며, 프로젝트에서 확인한 구현과 검증 내용을 정리함.

## 시연 영상과 셰이더 비교

<div class="ratio ratio-16x9 mb-4">
  <iframe src="https://www.youtube.com/embed/ohuVXfWt2A4" title="Point Nemo 수중 렌더링 데모 영상" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

[YouTube에서 시연 영상 보기](https://www.youtube.com/watch?v=ohuVXfWt2A4)

![같은 카메라에서 수중 셰이더를 단계별로 적용한 무자막 GIF](/assets/img/projects/point-nemo/point-nemo-shader-breakdown.gif)

기본 조명 → 수면 → RGB 감쇠 → backscatter → 그림자 기반 햇빛 산란 → 투영 카우스틱 → 수중 환경 합성 → 물고기와 부유 입자 순서로 비교함.

카메라와 셰이더 시간을 고정한 정지 캡처 8단계를 16.4초마다 반복하며, 실제 시간에 따른 움직임은 위 영상으로 제시함.
현재 구도에서 투영 카우스틱의 변화는 미세하며, ON/OFF 차이가 검출되지 않은 바닥 카우스틱 단계는 GIF에서 제외함.

## 거리와 그림자를 반영하는 수중 산란

가까운 산호의 색과 먼 배경의 가시성이 달라지고, 햇빛이 가려진 구간이 물속 산란에 반영되도록 구현함.

### Why?

- 기존 장면의 밝은 광선 기둥이 주변 산호의 그림자와 연결되지 않아 물속에 독립된 발광 물체가 놓인 것처럼 보였음.
- 산호의 색을 유지하면서 수중 거리감을 표현하기 위해, 물체에서 오는 빛의 감쇠와 물속에서 추가되는 산란광을 구분할 필요가 있었음.

### How?

- 기존 URP의 opaque texture와 depth texture를 사용해 장면 색과 월드 공간 거리를 얻고, RGB별 감쇠와 backscatter를 별도로 계산함.
- 광선 평면의 밝기를 조절하는 기존 방식에서, 시선 경로의 16개 지점에서 햇빛의 그림자와 감쇠를 평가하는 방식으로 변경함.

### Solution

- Beer-Lambert 감쇠와 Henyey-Greenstein 위상 함수를 적용하고, 수면에서 샘플까지와 샘플에서 카메라까지의 광 경로를 함께 반영함.
- 기존 광선 평면을 비활성화하고, 위를 보는 광선은 수면에서 물속 구간을 끝내도록 처리했으며, 전체 해상도에서 수행하는 16회 샘플링의 GPU 비용은 아직 측정하지 않았음.


| 수면까지 적용 | RGB 감쇠 추가 |
|---|---|
| ![수면까지 적용한 기준 화면](/assets/img/projects/point-nemo/01_add_water_surface.png) | ![동일한 카메라에서 RGB 감쇠를 추가한 화면](/assets/img/projects/point-nemo/02_add_rgb_attenuation.png) |

같은 카메라, 셰이더 시간, 후처리 조건에서 RGB 감쇠를 추가해 산호와 배경의 색 변화를 비교함.

## 파랗게 뭉개지는 모래 바닥 추적

가까운 바닥이 먼 배경처럼 처리되는 문제를 깊이/법선 패스에서 수정하고, 첫 캡처의 초기화 문제도 분리해 해결함.

### Why?

- 밝은 모래 재질을 적용해도 수중 효과를 켜면 바닥이 파랗게 뭉개져, 재질과 물의 감쇠 중 어느 단계가 원인인지 구분해야 했음.
- 오프라인 캡처의 첫 렌더에서는 검은 바닥도 나타나, 한 장의 이미지로 수정 결과를 판단하기 어려웠음.

### How?

- 수중 효과를 켠 화면과 끈 화면을 비교하고, 깊이 값을 회색으로 출력해 색 버퍼와 깊이 버퍼를 나누어 확인함.
- SSAO가 사용하는 깊이/법선 prepass에 바닥 셰이더가 참여하는지 확인하고, 연속 렌더 결과를 비교해 카메라 초기화에 따른 차이도 추적함.

### Solution

- 바닥 셰이더에 DepthNormals 패스를 추가하고, 캡처 전에 카메라를 예열하도록 수정한 뒤 가까운 모래의 색과 깊이 처리가 함께 표시되는 것을 확인함.
- 수중 합성에 쓰는 opaque texture를 전체 해상도로 변경하고, 깊이/법선 패스의 존재와 텍스처 설정을 회귀 검사해 누락을 방지함.


## 시선과 표면에 반응하는 수면 광학

수면을 보는 각도에 따라 투과와 반사가 달라지고, 카우스틱이 산호와 모래의 방향 및 그림자를 따르도록 구성함.

### Why?

- 수중에서 수면을 올려다볼 때 하늘이 보이는 영역과 반사가 강한 영역을 구분해야 물 표면의 성질을 전달할 수 있었음.
- 카우스틱을 표면색과 무관하게 더하면 어두운 산호와 그늘까지 밝아져 조명 관계가 흐트러질 수 있었음.

### How?

- 기존 다섯 개의 Gerstner 파도와 미세 법선 표현을 유지하면서 물에서 공기로 향하는 프레넬 계산에 전반사 조건을 추가함.
- opaque depth로 복원한 표면 위치와 방향에 카우스틱을 투영하고, 수심과 주광원 그림자에 따라 강도를 감쇠시킴.

### Solution

- 스넬 창을 통한 하늘빛과 각도별 반사를 표현하고, 수면 자체의 색에도 수면에서 카메라까지의 RGB 감쇠를 적용함.
- 카우스틱을 표면색에 곱해 어두운 재질과 그림자를 존중하도록 구성했으며, 반사는 환경색 근사이고 카우스틱은 광자 추적이 아닌 해석적 무늬 계산임.


![수면 셰이더를 사용하는 물체만 표시한 화면](/assets/img/projects/point-nemo/21_shader_water_surface.png)

현재 시선에서 수면 셰이더가 차지하는 영역을 분리해 확인했으며, 다른 물체를 숨긴 보조 이미지이므로 전체 장면의 반사 정확도를 입증하는 자료는 아님.

## 편집 화면과 실행 화면의 시각 객체 동기화

산호 배치와 광학 설정을 씬에 저장하고, 실행 중에는 저장된 시각 객체의 상태만 갱신하도록 구성함.

### Why?

- 시각 객체가 실행 중에만 생성되면 편집 화면에서 실제 배치와 참조를 확인하기 어려워, 씬에 표현 계층을 저장하는 제약을 유지해야 했음.
- 후처리 프로파일의 참조가 비어 있었고, 재질과 런타임 컴포넌트가 각각 광학 계수를 보유해 설정을 함께 맞출 필요가 있었음.

### How?

- 기존 에디터 배치 도구를 확장해 외부 산호 모델의 프리팹 연결을 유지한 채 3종 56개를 저장하고, 스캔에 포함된 받침대는 지면 아래로 배치함.
- 베이크 시 재질의 광학 계수를 런타임 컴포넌트에 동기화하고, ACES와 노출 보정 및 블룸을 프로파일의 실제 subasset으로 저장함.

### Solution

- 런타임에서는 MaterialPropertyBlock으로 카메라 수심과 광학 값을 전달해 공유 재질 에셋을 변경하지 않도록 처리함.
- 회귀 검사로 프리팹 연결과 후처리 참조를 확인하고, Play Mode에서 기존 GPU 물고기 시뮬레이션이 실행되는 동안 계층이 늘어나지 않고 광학 값이 유지되는 것을 확인함.


---

## 작업 범위와 외부 에셋

산호 모델은 Smithsonian CC0/Open Access 스캔을 사용했고, 물고기와 일부 환경 소품은 Kenney 에셋을 사용했으며 직접 모델링한 작업에 포함하지 않음.
코드 수정, 씬 베이크, 진단과 테스트 실행에 AI 코딩 도구를 활용했으며, 본 초안의 구현 설명과 별도로 개인 설계 및 검증 범위를 게시 전에 확정해야 함.
GPU frame time과 메모리 비교는 아직 측정하지 않았으므로 성능 개선 수치를 제시하지 않음.