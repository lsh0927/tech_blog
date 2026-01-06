---
title: "AWS의 구조"
date: 2026-01-06
excerpt: "AWS"
tags: ["DevOps"]
---

# AWS의 리전

- 서비스가 제공되는 서버의 물리적 위치
- 각 리전에는 고유 코드가 부여

## 리전을 선택할때 고려할 점

- 지연속도
- 법률
- 지원하는 AWS 서비스

## 가용영역

- 리전의 하부 단위
- 하나의 리전은 3개 이상의 가용영역으로 구성
- AZ라고 줄여 부름

## 엣지 로케이션

- AWS의 CDN등 여러 서비스를 가장 빠른 속도로 제공(캐싱)하기 위한 거점

## ARN

- AWS의 리소스에 부여되는 고유 아이디

---


## AWS 계정의 의미

- 리소스 관리의 일반적인 최대 단위
- Ex) 계정별 최대 S3 최대 버킷 개수

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/7d3f0df6-bde9-4f54-8dfd-2a03a9515f90/b80b5ade-6b2c-49bd-b2fd-28e5b9041efc/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SQIMNGNN%2F20260106%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260106T141353Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJb%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDzu5j4m5iSZrKbse%2FKXFRoOX3sZSi3dHOGs%2BcG1I3ynAIgN7JGU3XHl4N9QbtEgNZpJ9afENwZjTRTw%2BV9JRSNQwwq%2FwMIXxAAGgw2Mzc0MjMxODM4MDUiDMm9opqJcqxQk6CYiyrcA7b1On5u4HgrOn4vPJsLbFiryQC33BuRGKmHDuT9Trmh8Uy9B9YAK%2Bu%2BYsQdNyNdoa%2FlFJxt5824LFngkKrSDNgKHC0GVBJPt9e6QvJiCzVX7gCCAjEVe6elVhV9bjnoAFJ6ZPnOfnjeySQXncP7ciP%2FPsKKHke116iwM%2F5OFH6LHnf4Gp%2BHFrDyalurXAg4f8BDIB6f7m6M5eZ%2BxqHJemdjTlAD0Vp%2FGCUJ%2B2rLvVv4D00imjebsIRz3TqBoruvNNxllFWrs7GJuEmsU43f5WJg8uGAhLmcpzQwDhfyQjN0NqTuDxpdm8f4Jue5clEaUplvuIwkHz5RWJfbtIXQYabyINxilPqZB2Z1hP%2BCogbZYSfvZw8XnRLtISud5FJJSbGOQSs6UiO7hSWUVoPAalSNw%2BPyua92FBnTSzkOtJKAPeDh%2BupYOlrGIS78z16iN%2BX8O1p9OTr2y5yu1u%2BOPDsMWUHlau1dXmKF0D%2BJZ1mOVVft7KYWyVQfIOCd9rpL5VWvrW99UmzUfJzI6R8SDkHg3rvDUfGVBMOJoV4aq4wTgiXapdmV%2FM2vRftdol4j%2FsWjCLMxPAWzU87eKs9djgH6vpAO6rPz9dSvjC18Ps6xHHiv77GscXIAG%2BvgMP6m9MoGOqUB7ZzOW9WkA3hk1%2FnzM8K2O60zWxDUS2ymAAX89hgrgXg%2FKUflYRWPjAsXDo31ckgKc9F40q%2FrcbOi68QL0EMVcxnPR3v9ikn84PDc%2F5ZQuCzYBJjJz9jKxgMvpw7qt0xxRPoDfaJMwhuPZTR74vZsA4%2FuNmTuKWdsn%2FnBQBB7XyL4edr5ydG9kLMHQdvur6Fh%2Fnr5Pk4k6V%2F242J0M08M4UUEK9Gp&X-Amz-Signature=b40f6ad3bdbea335f98a9befb7b499a0450b69a536f76b80ff5c186abd5de15c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)