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

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/7d3f0df6-bde9-4f54-8dfd-2a03a9515f90/b80b5ade-6b2c-49bd-b2fd-28e5b9041efc/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466VRQXOPRZ%2F20260106%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260106T233040Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJ%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIDLlqeiAYsOL43w%2FRT6JJPepAXTwX5U6VkPsRf%2F71F5zAiBft8cN06bC7RwD7gvT0fEb4CwI7OB66vaOIZutlFPvvir%2FAwhoEAAaDDYzNzQyMzE4MzgwNSIMIh7I2MAUpXwvp0DAKtwDv5RgT4XoUMPB0EBai03Wew2DAXTs%2BJF14GIo2PAgK73z2aPEATfpBrTMlU4rRismZ9NYplhdByOInOdWuWlcLXCITbkkA8Fi6Gin1Ndunn8b5vKs7mv9GueFd8Gqgs%2FW%2FhRmNw1VYtcrbQ1tn2EICwS2EDHxkcSmoLPF6im%2FLbou4%2BwrczXITFaEx8F2Rw6tr%2BpIZ%2F5x%2FCcjsSMlQd6izisEP2iw9nwkApztbGrbgyj2IWBNtV5eJpjeDp1pPMcVSXAFUVUzuZo9A05i1kty65wsDsbGW3KL7N0QVaBWOxT11fhhEEjY5lcasS6OpekDCzo%2Bf6iMe6fNgWRGIG3IVRdElO6ZVcu01I3fEeZkFoLfV1w0f3ntGEVGuLKHHRbKBp2TmHDaHNvnk1GT%2FssmiPt4XWfcEesdW2ABiSIogxYaQ4PVgMjVkGZn26Yqb%2FfUmCokgMFwlvhAtdKIs09iQqaUjALU61cYuQP428GvFCLn%2F4Fj6p9n908l2c1pXO%2BUYs0bmtPwmrY9750rgQAnJ4rDIiWmygzYX7WuRfTEOIABj%2Bje95%2B%2FADVHbBO1msoMtu55wVhbtqf03yu7bsF4%2FXhSNB%2FjUGV9qUDLYoIy9OkiDrOZ8keD%2BUVKGUww4an2ygY6pgFJmM8Pt9q0c6pJFF%2FNB%2FXSCp6D3EKVG3yI6ZZBMdsi8zat6R3CfZLYf41ALtSroNAqwUmHdpR7o1sc5sS9nlKlDvI8j8G%2FOCEQg7b3DcrVnRl3J5%2BAOh3tIU28%2FzWUKGCPhIk6kI%2BVHRSfE40mTwp1%2FHi0bAS%2Bpoom5lljUXKPrNawyEFjckKt%2FxA0uvYExcnwZmr%2FzaZfbnMhs1I4fqli6%2B90Uhbu&X-Amz-Signature=c33b6b94a8d007107e576a511ee1ed4c8f8edda0e456baf0f70e4df9e96d8aaa&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)