---
title: "Clasher2D: 3D 애니메이션의 PNG 베이크와 초상화 자동화"
date: 2026-09-05 00:00:00 +0900
categories: [Portfolio]
tags: [C#, Unity, Editor, Sprite, ComfyUI, PowerShell]
description: "모바일 전투의 반복적인 3D 표현 비용을 8방향 PNG 베이크로 옮기고, ComfyUI 초상화 자동화까지 연결한 에셋 파이프라인"
image:
  path: /assets/img/projects/clasher/halberdier-n.png
  alt: 3D 할버더의 공격 애니메이션에서 베이크한 PNG 프레임
stack: "C#, Unity Editor, Playables, RenderTexture, ComfyUI API, PowerShell"
project_group: games
permalink: /clasher/
portfolio: true
hide_from_home: true
unlisted: true
toc: true
mermaid: true
sitemap: false
noindex: true
---

모바일 전투에서 여러 캐릭터를 동시에 표시하기 위해 **3D 애니메이션을 8방향 PNG로 미리 계산하는 베이크 파이프라인**을 구현함. 같은 과정에서 얻은 정면 렌더를 ComfyUI 초상화 자동화의 입력으로 사용하고, 두 출력물을 전투 유닛과 카드 UI에 연결함.

구현 범위는 Unity Editor 베이커, sprite 재생 데이터와 프리팹 생성, ComfyUI API 배치 처리 및 전투 연결이며, 원본 캐릭터 모델과 애니메이션은 기존 에셋을 활용함.

<div style="width:100%;max-width:360px;aspect-ratio:9/16;margin:1.5rem auto">
  <iframe src="https://www.youtube-nocookie.com/embed/ZiRJr_X7Xak?playsinline=1&amp;rel=0" title="Clasher2D 플레이 영상" width="360" height="640" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="display:block;width:100%;height:100%;border:0;border-radius:12px"></iframe>
</div>

[YouTube에서 플레이 영상 보기](https://www.youtube.com/shorts/ZiRJr_X7Xak)

## 모바일에서 반복되는 캐릭터 표현 비용

최적화의 출발점은 캐릭터 한 개의 폴리곤 수보다 **전투 중 늘어나는 유닛 수에 따라 어떤 작업이 반복되는가**였음.

유닛이 추가되면 이동과 타깃 탐색뿐 아니라 각 인스턴스의 애니메이션 포즈 평가, bone transform 갱신과 skinned mesh 변형도 함께 발생함. 캐릭터 모델이 작고 저해상도로 보이더라도 포즈를 계산하는 과정 자체가 사라지지는 않으므로, 메시의 폴리곤 수를 줄이는 것과 애니메이션 실행 경로를 바꾸는 것은 서로 다른 최적화 대상임. ([Unity 캐릭터 최적화 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/ModelingOptimizedCharacters.html))

모바일에서는 이러한 연산이 전투 로직, 이펙트와 UI가 사용하는 자원과 경쟁함. 60fps의 프레임 간격은 약 16.7ms, 30fps는 약 33.3ms이므로 캐릭터 표현에 쓰는 시간이 커질수록 다른 처리에 사용할 여유가 줄어듦. 여기에 CPU와 GPU의 높은 부하가 오래 지속되면 발열과 배터리 소모가 늘고, thermal throttling으로 실행 속도가 떨어질 수 있어 순간적인 FPS뿐 아니라 지속 가능한 프레임 시간이 중요함. ([Unity 모바일 프로파일링 가이드](https://unity.com/how-to/best-practices-for-profiling-game-performance))

이 프로젝트는 제한된 시점에서 전장을 내려다보며 캐릭터를 비교적 작게 표시하므로, 모든 각도에서 원본 3D 모델을 다시 렌더할 필요를 줄일 수 있었음. 이에 애니메이션의 포즈와 표면 표현을 제작 단계에서 PNG로 저장하고, 실행 중에는 현재 동작과 방향에 맞는 이미지를 선택하는 구조로 구현함.

| 구분 | 원본 3D 캐릭터 재생 | PNG sprite actor 재생 |
| --- | --- | --- |
| 동작 표현 | 실행 중 포즈를 평가하고 mesh를 변형함 | 제작 단계에서 계산한 프레임을 선택함 |
| 표면 표현 | 원본 geometry와 재질을 렌더함 | 촬영한 표면 표현을 texture에서 읽음 |
| 방향 전환 | 현재 시점에서 모델을 다시 그릴 수 있음 | 준비된 8방향 중 하나를 선택함 |
| 관리할 비용 | bone, vertex와 재질 구성이 중요함 | texture memory, 투명 픽셀과 배치 구성이 중요함 |

이 선택으로 동적인 조명에 대한 원본 3D 표면의 반응이나 연속적인 시점 변화는 제한됨. 대신 동일 캐릭터의 여러 인스턴스가 공유하는 PNG와 SpriteSet을 사용하면서, 각 유닛은 자신의 동작, 방향과 재생 시간만 관리하도록 구성함.

## 3D Prefab에서 게임용 PNG까지

베이크의 결과를 이미지 파일에서 끝내지 않고, 게임이 바로 읽을 수 있는 재생 데이터와 프리팹까지 생성하도록 구성함.

```mermaid
flowchart LR
    A[3D Prefab + AnimationClip] --> B[Unity Editor 프레임 샘플링]
    B --> C[8방향 투명 PNG]
    C --> D[SpriteSet + 재생 Prefab]
    B --> E[정면 고해상도 렌더]
    E --> F[상반신 crop + ComfyUI img2img]
    F --> G[초상화 PNG + 생성 기록]
    D --> H[전투 유닛]
    G --> I[카드 UI]
```

별도의 Preview Scene에 촬영용 rig와 원본 Prefab을 배치하고, clip의 특정 시점에서 얻은 포즈를 45도 간격으로 여덟 번 렌더함. 이 과정을 프레임별로 반복해 `캐릭터_동작_방향_프레임.png` 형태로 저장함. 각 이미지는 `RenderTexture`의 RGBA 결과를 읽어 PNG로 인코딩하므로 배경의 투명도를 유지할 수 있음.

PNG를 Unity Sprite로 import한 뒤 frame 우선, direction 후순서로 `EightWaySpriteSet`에 연결함. 원본 clip, 입력 프레임 구간, 출력 프레임 구간, 재생 속도와 loop 여부도 metadata에 함께 남겨 이미지 순서를 다시 추정하지 않아도 되도록 구성함. 캐릭터별 반복 실행은 `bake-all-eightway.ps1`이 처리함.

<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;background:#172338;padding:12px;border-radius:12px">
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-n.png" alt="할버더 공격 프레임, n 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>n</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-ne.png" alt="할버더 공격 프레임, ne 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>ne</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-e.png" alt="할버더 공격 프레임, e 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>e</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-se.png" alt="할버더 공격 프레임, se 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>se</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-s.png" alt="할버더 공격 프레임, s 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>s</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-sw.png" alt="할버더 공격 프레임, sw 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>sw</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-w.png" alt="할버더 공격 프레임, w 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>w</figcaption></figure>
  <figure style="margin:0;text-align:center"><img src="/assets/img/projects/clasher/halberdier-nw.png" alt="할버더 공격 프레임, nw 방향" width="256" height="256" loading="lazy" style="width:100%;height:auto" /><figcaption>nw</figcaption></figure>
</div>

*할버더 `Attack_A`의 같은 프레임을 여덟 방향에서 촬영한 실제 PNG 출력이며, 방향 이름은 베이크 카메라의 시점을 나타냄.*

### 해상도와 시간 해상도를 함께 조절

기본 출력은 256×256, 12fps, clip당 최대 48프레임으로 설정함. 모바일 전장의 작은 캐릭터에 필요한 실루엣과 공격 동작을 읽을 수 있는지 확인하면서, 해상도와 샘플 수를 조절할 수 있게 한 구성임. 고해상도 출력이 항상 유리한 것은 아니며, 가로와 세로를 각각 두 배로 올리면 프레임당 픽셀 수는 네 배가 됨.

여기서 12fps는 캐릭터 이미지가 바뀌는 시간 간격이며 게임 전체를 12fps로 실행한다는 뜻이 아님. 유닛의 위치는 게임 frame마다 갱신하고, sprite는 재생 시간에 해당하는 프레임을 선택함. 8방향 역시 연속적인 회전을 이미지 선택으로 바꾸는 결정이므로, 방향 경계에서의 전환과 빠른 공격의 가독성을 확인해야 함.

## 베이크 중 포즈와 크기가 흔들리는 문제

프레임을 많이 출력하는 것보다 **각 PNG가 의도한 포즈와 일관된 크기를 담는 것**이 먼저였음.

포즈를 샘플링해도 offscreen 상태의 skinned mesh가 갱신되지 않으면 변경한 팔 동작이 촬영 결과에 반영되지 않는 문제가 있었음. Animator가 있는 모델은 manual `PlayableGraph`에서 clip의 시간을 지정해 평가하고, `AlwaysAnimate`, `updateWhenOffscreen`, `forceMatrixRecalculationPerRender`를 설정해 포즈와 렌더의 갱신을 맞춤. 공격 팔의 가독성 보정도 샘플링 이후에 적용해 최종 포즈가 이미지에 포함되도록 구성함.

카메라 크기를 동작마다 맞추면 같은 캐릭터가 공격할 때 커지고 이동할 때 작아 보일 수 있었음. 동작과 방향에 따른 projected bounds를 측정한 뒤, 가장 큰 bounds를 기준으로 5% 여유를 둔 공통 orthographic size를 사용함. 이를 통해 무기까지 촬영 범위에 포함하면서 동작 전환 시 크기를 유지하도록 구성함.

촬영 결과에 불투명한 픽셀이 하나도 없으면 실패로 처리해 빈 PNG가 정상 결과로 넘어가지 않게 함. 종료 시에는 카메라 target, 활성 RenderTexture와 변경한 Animator 및 renderer 설정을 복원해 다음 베이크에 상태가 남지 않도록 처리함.

## PNG 재생과 전투 연결

게임 코드는 원본 clip 이름 대신 `Idle`, `Move`, `Attack`, `Hit`, `Death` 같은 action을 요청하도록 구성함. 캐릭터마다 다른 `Walk`, `Run`, `Attack_A` 등의 이름은 SpriteSet의 action binding에서 연결함.

`EightWaySpriteAnimator`는 방향 벡터를 45도 간격으로 나누고, 베이크 카메라 시점과 캐릭터 진행 방향을 맞추기 위해 기본 180도 보정을 적용함. 프레임은 `frameIndex * 8 + directionIndex`로 조회하며, 공격과 피격 같은 one-shot 동작이 끝나면 지정한 이동 또는 대기 동작으로 복귀하도록 구현함.

생성한 SpriteRenderer 프리팹을 전투 유닛 7종에 연결하고, 실루엣 그림자는 `LateUpdate`에서 몸체의 현재 sprite와 flip을 복사하도록 구성함. 공용 8장 덱의 네 슬롯을 통해 유닛을 배치한 뒤 소환 대기, 이동, 공격과 사망까지 같은 재생 경로로 이어지도록 구현함. 이 전투는 베이크한 결과가 실제 게임에서 소비되는 적용 사례임.

## 연산을 줄이는 대신 관리해야 할 비용

PNG 베이크는 실행 중 계산하던 정보를 texture에 저장하는 선택이므로, 모바일 최적화에서는 저장량과 렌더링 비용도 함께 관리해야 함.

할버더의 `Attack_A`는 실제 출력 기준 19프레임과 8방향으로 PNG 152장이 생성됨. 이를 RGBA32, mipmap 없음, 비압축으로 가정하면 `256 × 256 × 4 × 152 = 38 MiB`가 됨. 이 값은 한 동작의 픽셀 저장량을 설명하기 위한 계산이며 실제 단말 측정값은 아님. 디스크의 PNG 압축 크기와 GPU에 올라가는 texture 형식 및 로딩 범위는 서로 구분해야 함.

현재는 개별 PNG와 공유 SpriteSet을 사용하며, importer에서 압축 설정을 적용하고 mipmap을 끄도록 구성함. 여러 유닛이 서로 다른 프레임 texture를 표시하면 texture 전환과 배치 분리가 생길 수 있으므로, 이미지로 바꿨다는 이유만으로 draw call이 하나가 되지는 않음. Sprite Atlas는 이런 전환을 줄이는 후속 수단이지만, 묶는 범위에 따라 함께 로드되는 이미지도 달라져 캐릭터와 동작의 사용 패턴을 고려해야 함. ([Unity Sprite Atlas 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/sprite/atlas/atlas-landing.html))

몸체, 반투명 그림자와 불 이펙트가 겹치면 같은 화면 픽셀을 반복 처리하는 overdraw가 남음. 실루엣 그림자도 몸체 texture를 공유하지만 별도의 SpriteRenderer로 한 번 더 그리므로 렌더링 비용이 없는 표현은 아님. ([Unity 모바일 그래픽 가이드](https://unity.com/blog/games/optimize-your-mobile-game-performance-expert-tips-on-graphics-and-assets))

현재 완료한 범위는 베이크 및 sprite 재생 구조이며, atlas 적용과 모바일 전용 압축 형식은 확정하지 않았음. 후속 최적화는 실제 단말에서 비용을 확인한 뒤 다음 기준으로 진행할 수 있도록 구분함.

| 단말에서 확인할 비용 | 우선 검토할 항목 |
| --- | --- |
| texture memory와 로딩량 | 출력 해상도, 프레임 수와 asset 로딩 범위를 검토함 |
| texture 전환과 batches | atlas 구성과 재질 공유, 정렬 조건을 검토함 |
| 투명 효과가 겹친 구간의 GPU 시간 | 투명 영역과 그림자 및 이펙트가 덮는 면적을 검토함 |

## ComfyUI로 카드 초상화 제작 자동화

같은 3D 원본을 전투용 PNG와 카드 초상화의 입력으로 사용해, 캐릭터별 이미지 준비부터 결과 저장까지 이어지는 제작 경로를 구성함.

모바일의 카드 슬롯에서는 캐릭터를 빠르게 구분해야 하지만 전신 sprite를 축소하면 얼굴이 작아지는 문제가 있었음. 베이크 시 생성한 정면 고해상도 렌더에서 alpha bounds를 찾고, 상반신을 중심으로 정사각형 crop을 만들어 1024×1024 입력으로 정규화함.

<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
  <figure style="margin:0"><img src="/assets/img/projects/clasher/portrait-source.png" alt="베이크 과정에서 렌더한 할버더 정면 원본" width="1024" height="1024" loading="lazy" style="width:100%;height:auto;background:#172338" /><figcaption>정면 렌더</figcaption></figure>
  <figure style="margin:0"><img src="/assets/img/projects/clasher/portrait-input.png" alt="alpha bounds를 기준으로 상반신을 잘라 정규화한 ComfyUI 입력" width="1024" height="1024" loading="lazy" style="width:100%;height:auto" /><figcaption>자동 crop 입력</figcaption></figure>
  <figure style="margin:0"><img src="/assets/img/projects/clasher/portrait-output.png" alt="기존 ComfyUI workflow로 생성한 할버더 카드 초상화" width="1024" height="1024" loading="lazy" style="width:100%;height:auto" /><figcaption>ComfyUI 출력</figcaption></figure>
</div>

*기존 파이프라인에서 생성한 정면 렌더, 자동 crop 입력과 ComfyUI 초상화 출력의 비교임.*

`comfy-generate-portraits.ps1`은 표준 API workflow에 입력 이미지, 공통 prompt, 캐릭터별 설명, checkpoint, LoRA와 seed를 주입함. `/upload/image`로 입력을 전송하고 `/prompt`로 작업을 제출한 뒤, `/history/{promptId}`에서 완료를 확인하고 `/view`로 결과를 내려받도록 구현함. 캐릭터마다 crop, 업로드와 workflow 설정을 반복하는 부분을 자동화한 작업임.

여러 캐릭터의 배치 처리를 위해 실행 전 노드와 모델 구성을 검사하고, 요청별 실패 상태와 timeout을 처리함. 출력 PNG 옆에는 원본과 정규화 입력, 실제 prompt, 모델 이름, seed, sampler, steps와 denoise를 provenance JSON으로 기록함. 할버더의 기존 기록에서 1024 해상도, 32 steps와 denoise 0.6을 확인할 수 있으며, 파일만 남겼을 때와 달리 생성 조건을 다시 추적할 수 있음.

ComfyUI 추론은 개발 환경에서 수행하고 게임에는 완성된 초상화를 연결함. 따라서 모바일 게임이 모델을 실행하거나 생성 완료를 기다릴 필요가 없도록 구성했으며, 단말에서는 최종 이미지의 해상도와 압축을 관리하면 됨. 생성 원본의 시각 검토와 카드 표시 크기에 맞춘 최종 texture 설정은 API 자동화와 구분되는 작업임.

## 확인한 결과와 단말 검증 범위

확인한 결과는 방향별 PNG 출력, 원본 clip과 출력 frame의 metadata 연결, 전투 프리팹의 참조 및 방향별 sprite 동기화임. 실제 카드 입력 경로를 사용하는 플레이어 AI로 한 경기를 진행한 기록도 남겼으며, 상단 영상은 사용자가 제공한 플레이 데모임.

이러한 기능 검증은 베이크 결과가 게임 안에서 재생된다는 근거이며 모바일 성능 개선의 측정 결과는 아님. 3D 재생 경로와의 성능 비교에는 같은 단말, build, 유닛 구성과 카메라 조건이 필요하고, 일정 시간 플레이한 뒤 발열 상태를 포함한 CPU 및 GPU frame time과 texture memory를 확인해야 함. 현재 문서에서는 그 실측 경계까지 구분해 구현 결과를 설명함.
