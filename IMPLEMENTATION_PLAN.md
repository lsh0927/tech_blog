# 🏗️ AI 블로그 시스템 구현 계획서

## 📐 아키텍처 개요

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   로컬 작성     │──────▶│  GitHub Actions │──────▶│ Cloudflare Pages│
│  (MDX + 이미지) │      │  (빌드 + AI)    │      │   (정적 배포)   │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   OpenAI API    │
                         │  (Embeddings)   │
                         └─────────────────┘
```

---

## 🔐 권한 모델

| 역할 | 포스트 작성 | 포스트 조회 | 방법 |
|------|------------|------------|------|
| **본인** | ✅ | ✅ | Git push (로컬에서만 가능) |
| **방문자** | ❌ | ✅ | 정적 사이트 접근 |

---

## 🎨 디자인 시스템

### 컬러 팔레트 (다크 테마)
```css
:root {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #242424;
  --text-primary: #f5f5f5;
  --text-secondary: #a3a3a3;
  --accent: #d4a574;       /* 따뜻한 골드 */
  --link: #7dd3fc;         /* 하늘색 */
  --graph-node: #6366f1;   /* 인디고 */
  --graph-edge: #4b5563;   /* 그레이 */
}
```

### 타이포그래피
- **본문**: Pretendard (한글), Geist Sans (영문)
- **코드**: JetBrains Mono
- **본문 폭**: 720px (최대)
- **줄 높이**: 1.8

### 이미지 정렬 시스템
- 일반 이미지: 본문 너비 (720px)
- 풀 너비 이미지: 돌출 (900px)
- 갤러리: 2-3열 그리드
- 모든 이미지: lazy loading + blur placeholder

---

## 🧠 AI 그래프 뷰 시스템

### 파이프라인
```
MDX 파싱 → 텍스트 추출 → OpenAI Embedding → 코사인 유사도 → 그래프 JSON
```

### 데이터 구조
```json
{
  "nodes": [
    {
      "id": "llm-chapter-1",
      "title": "LLM 1장",
      "tags": ["LLM", "AI"],
      "group": 0,
      "connections": 5
    }
  ],
  "edges": [
    {
      "source": "llm-chapter-1",
      "target": "transformer-explained",
      "weight": 0.85
    }
  ]
}
```

### 시각화 스펙
- **라이브러리**: D3.js force-directed graph
- **노드 크기**: 연결 수에 비례
- **노드 색상**: 태그 기반 클러스터
- **엣지 두께**: 유사도 강도 (0.7-1.0)
- **인터랙션**: 드래그, 줌, 클릭 → 포스트 이동

---

## 📁 프로젝트 구조

```
blog/
├── src/
│   ├── components/
│   │   ├── Graph/
│   │   │   └── GraphCanvas.tsx    # D3 그래프
│   │   ├── Image/
│   │   │   ├── ResponsiveImage.tsx
│   │   │   ├── FullWidthImage.tsx
│   │   │   └── ImageGallery.tsx
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── posts/index.astro
│   │   ├── posts/[slug].astro
│   │   ├── graph.astro
│   │   ├── tags/index.astro
│   │   ├── tags/[tag].astro
│   │   └── about.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── posts/
│   │       └── *.mdx
│   └── styles/
│       └── global.css
├── public/
│   ├── images/
│   ├── favicon.svg
│   ├── embeddings.json
│   └── graph-data.json
├── scripts/
│   ├── generate-embeddings.ts
│   └── build-graph.ts
├── .github/
│   └── workflows/
│       └── deploy.yml
├── astro.config.mjs
├── tsconfig.json
├── package.json
└── IMPLEMENTATION_PLAN.md
```

---

## 🚀 배포 파이프라인

```yaml
# GitHub Actions 워크플로우
1. git push → 트리거
2. npm ci
3. generate:embeddings (OpenAI API)
4. build:graph (유사도 계산)
5. astro build (정적 생성)
6. Cloudflare Pages 배포
```

### 필요한 시크릿
- `OPENAI_API_KEY`: OpenAI API 키
- `CF_API_TOKEN`: Cloudflare API 토큰
- `CF_ACCOUNT_ID`: Cloudflare 계정 ID

---

## 💰 예상 비용

| 항목 | 월간 비용 |
|------|----------|
| Cloudflare Pages | $0 (무료) |
| OpenAI Embeddings | ~$0.10 (100 포스트 기준) |
| 도메인 (선택) | ~$1 |
| **합계** | **~$1.10/월** |

---

## 📋 구현 단계 (✅ 완료)

### 1단계: 프로젝트 초기화 ✅
- [x] Astro 프로젝트 생성
- [x] 의존성 설치 (React, Tailwind, MDX, D3, OpenAI)
- [x] 기본 디렉토리 구조 생성

### 2단계: 디자인 시스템 및 레이아웃 ✅
- [x] Tailwind 설정 + CSS 변수
- [x] 폰트 설정 (Pretendard, Geist)
- [x] Header/Footer 컴포넌트
- [x] BaseLayout 구성

### 3단계: MDX 및 이미지 컴포넌트 ✅
- [x] MDX 통합 설정 (Content Collection)
- [x] ResponsiveImage 컴포넌트
- [x] FullWidthImage 컴포넌트
- [x] ImageGallery 컴포넌트
- [x] 포스트 페이지 템플릿

### 4단계: AI 그래프 시스템 ✅
- [x] 임베딩 생성 스크립트 (generate-embeddings.ts)
- [x] 그래프 빌드 스크립트 (build-graph.ts)
- [x] 캐싱 시스템 (변경된 포스트만 재처리)

### 5단계: D3 그래프 시각화 ✅
- [x] GraphCanvas 컴포넌트
- [x] Force-directed 레이아웃
- [x] 인터랙션 (드래그, 줌, 클릭)
- [x] 노드 툴팁

### 6단계: 배포 설정 ✅
- [x] GitHub Actions 워크플로우
- [x] Cloudflare Pages 연동 설정
- [x] 환경변수 설정 템플릿

---

## 🔧 기술 스택

| 영역 | 기술 |
|------|------|
| **프레임워크** | Astro 5 |
| **UI 라이브러리** | React 19 |
| **스타일링** | Tailwind CSS 4 |
| **콘텐츠** | MDX |
| **그래프** | D3.js 7 |
| **AI** | OpenAI text-embedding-3-small |
| **배포** | Cloudflare Pages |
| **CI/CD** | GitHub Actions |

---

## 🚀 시작하기

### 로컬 개발
```bash
cd /Users/leeseungheon/Developer/blog

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 빌드 (AI 임베딩 포함)
export OPENAI_API_KEY=your-api-key
npm run build
```

### 새 포스트 작성
1. `src/content/posts/` 디렉토리에 `.mdx` 파일 생성
2. Frontmatter 추가:
   ```yaml
   ---
   title: "포스트 제목"
   date: 2025-01-02
   excerpt: "포스트 요약"
   tags: ["Tag1", "Tag2"]
   ---
   ```
3. MDX 콘텐츠 작성
4. Git push → 자동 배포

### 배포 설정
1. GitHub에 저장소 생성
2. Cloudflare Pages 프로젝트 연결
3. GitHub Secrets 추가:
   - `OPENAI_API_KEY`
   - `CF_API_TOKEN`
   - `CF_ACCOUNT_ID`

---

## 📝 참고 자료

- [Astro 공식 문서](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com)
- [D3.js Force Layout](https://d3js.org/d3-force)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Quartz (참고 프로젝트)](https://quartz.jzhao.xyz)
