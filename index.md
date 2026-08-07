---
layout: page
permalink: /
title: 홈
description: ""
---

<link rel="stylesheet" href="{{ '/assets/css/project-gallery.css' | relative_url }}">

## 프로필
{: .home-section-title}

<div class="profile-intro">
  <img class="profile-intro__photo" src="/assets/img/IMG_8923.jpg" alt="Hae Eem 프로필 사진">
  <div class="profile-intro__body">
    <h3>Hae Eem</h3>
    <p>C++ / C# 프로그래머입니다.</p>
    <div class="profile-intro__links">
      <a href="https://github.com/haelime">GitHub</a>
      <a href="mailto:loreminder@gmail.com">이메일</a>
    </div>
  </div>
</div>

## 경력
{: .home-section-title}

### 웨어러블에이아이

**시스템 소프트웨어 엔지니어 / 주임연구원** (2024.11–2025.04)

인천국제공항 자율주행 셔틀 프로젝트에서 UDP 기반 LiDAR 데이터 처리, C++/ROS2 기반 FSM 제어 로직, 생존 신호 기반 진단 및 고장 안전 시스템을 개발했습니다.

{% include project-gallery.html group="general" %}

## 교육
{: .home-section-title}

### École 42 Seoul

**42 Seoul 과정 수료** (2022.11–2024.11)

42는 프랑스에서 시작된 소프트웨어 교육 기관으로, 강의식 수업 대신 프로젝트 수행과 동료 평가를 중심으로 학습합니다. 공통 과정에서는 C, UNIX 파일 시스템과 프로세스, 네트워크, 객체 지향 프로그래밍 등을 단계적으로 다룹니다. [42 파리 공식 과정 안내](https://42.fr/le-campus-de-paris/diplome-informatique/)

42 파리 캠퍼스에는 별도 요건을 충족하면 프랑스 국가 직업 자격 체계에 등록된 [RNCP 6단계 자격](https://42.fr/le-campus-de-paris/diplome-informatique/concepteur-developpeur-solutions-informatiques/)과 [RNCP 7단계 자격](https://42.fr/le-campus-de-paris/diplome-informatique/expert-en-architecture-informatique/)을 취득하는 경로가 있습니다. [프랑스 공공 자격 체계](https://www.formulaires.service-public.fr/gf/getNotice.do?cerfaFormulaire=10443&cerfaNotice=50199)에서 학사 학위는 6단계, 석사 학위는 7단계로 분류되지만, 같은 단계의 RNCP 직업 자격이 대학 학위와 같은 뜻은 아닙니다. 아래 이력은 42 서울 과정에서 수행한 학습 내용입니다.

2년간 2,633시간 이상 오프라인으로 참여해 시스템 레벨 프로그래밍 중심의 자기주도적 동료 학습 프로젝트를 수행했습니다.

- C/C++ 기반 저수준 프로그래밍, 운영체제, 시스템 구조 역량 확보
- 성능 최적화, UNIX 시스템 관리, 네트워크 인프라 구축 기술 습득
- 110회 이상의 동료 평가를 주도하며 코드 분석, 기술 피드백, 코드 검토 역량 입증

## 기술

- 언어: `C++` `C#` `Python` `GLSL` `Shell`
- 게임: `Unity`
- 그래픽스: `컴퓨트 셰이더` `광선 추적` `3차원 그래픽스`
- 시스템과 도구: `ROS2` `Linux` `CMake` `Git` `GDB` `Valgrind`

## 프로젝트

### 게임

{% include project-gallery.html group="games" %}

### 그래픽스

{% include project-gallery.html group="graphics" %}
