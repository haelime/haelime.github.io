---
title: "Cat Meme Detector"
date: 2026-08-28 00:27:07 +0900
categories: [Portfolio]
tags: [C++, OpenCV, ONNX]
description: "표정과 손동작을 읽어 어울리는 고양이 밈을 골라 주는 C++ 데스크톱 앱"
stack: "C++17 · OpenCV 5.0 · ONNX · CMake"
period: "2026.08.27–2026.08.28"
repository: "https://github.com/haelime/cat-meme-detector"
media_placeholder: "표정이나 손동작에 따라 밈이 바뀌는 15초 내외의 시연 GIF · 16:9"
project_order: 10
project_group: general
portfolio: true
toc: false
mermaid: false
---

웹캠에서 표정과 손동작을 감지해 어울리는 고양이 밈을 고르는 C++ 데스크톱 앱입니다.

OpenCV의 DNN 모듈로 ONNX 모델을 실행하고, 이미지 특징과 CSV 라벨을 함께 사용해 밈을 선택합니다. 정지 이미지와 웹캠 입력을 지원하며 GIF 밈은 애니메이션으로 재생합니다.

## 구현한 것

- 얼굴 검출과 표정 분류, 손바닥 검출과 21개 손 관절 추정을 하나의 입력 흐름으로 연결했습니다.
- 색상·기울기·ORB 특징과 표정·손동작 라벨을 함께 계산해 밈을 선택했습니다.
- 손동작이 짧게 흔들릴 때 결과가 바로 바뀌지 않도록 연속 관측을 기준으로 상태를 확정했습니다.
- OpenCV 빌드부터 테스트, 실행에 필요한 에셋과 DLL 수집, ZIP과 SHA-256 생성까지 Windows 배포 과정을 자동화했습니다.

## 기술 선택

OpenCV는 카메라 입력, 이미지·GIF 디코딩, DNN 추론과 특징 추출을 한 라이브러리에서 처리할 수 있어 선택했습니다. 표정·손바닥·손 관절 모델은 ONNX 형식으로 통일해 OpenCV DNN에서 실행했습니다. CMake와 PowerShell은 Windows 빌드와 배포 단계를 반복 가능한 명령으로 묶는 데 사용했습니다.

## 링크

[GitHub Repository](https://github.com/haelime/cat-meme-detector)
