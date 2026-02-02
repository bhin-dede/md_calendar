# MD Calendar - Project Meta Information

> **For Sisyphus Agent**: 이 문서는 프로젝트 컨텍스트를 빠르게 파악하고 고도화 작업을 이어서 진행하기 위한 메타정보입니다.

---

## 1. Project Overview

### 1.1 프로젝트 목적
웹 기반 마크다운 뷰어/에디터 애플리케이션으로, 사용자가 마크다운 문서를 작성하고 관리하며 캘린더 형태로 시각화할 수 있는 도구입니다.

### 1.2 핵심 요구사항 (Original Requirements)
| 요구사항 | 구현 상태 |
|---------|----------|
| 화면 분할 (좌: 에디터, 우: 프리뷰) | ✅ 완료 |
| MD 파일 Import/Export | ✅ 완료 |
| MD 리스트 관리 기능 | ✅ 완료 |
| 네오브루탈리즘 디자인 | ✅ 완료 |
| IndexedDB 데이터 관리 | ✅ 완료 |
| 캘린더 보기 (날짜 기준 표시) | ✅ 완료 |

### 1.3 기술적 결정사항
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **마크다운 파싱**: marked (npm)
- **코드 하이라이팅**: highlight.js (npm)
- **XSS 방어**: DOMPurify (npm, dynamic import)
- **데이터 저장**: IndexedDB (클라이언트 사이드)
- **라우팅**: Next.js App Router
- **디자인**: Neobrutalism (네오브루탈리즘)

---

## 2. Project Structure

```
md_calendar/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (Header, ToastProvider)
│   │   ├── page.tsx                # 루트 페이지 (→ /editor 리다이렉트)
│   │   ├── editor/
│   │   │   ├── page.tsx            # 새 문서 에디터
│   │   │   └── [id]/page.tsx       # 기존 문서 편집
│   │   ├── list/page.tsx           # 문서 목록
│   │   └── calendar/page.tsx       # 캘린더 뷰
│   ├── components/
│   │   ├── Header.tsx              # 네비게이션 헤더
│   │   ├── Modal.tsx               # 모달, ConfirmModal
│   │   ├── editor/
│   │   │   ├── Editor.tsx          # 메인 에디터 컴포넌트
│   │   │   ├── EditorToolbar.tsx   # 마크다운 툴바
│   │   │   └── MarkdownPreview.tsx # 실시간 프리뷰
│   │   ├── document-list/
│   │   │   ├── DocumentList.tsx    # 문서 목록 컴포넌트
│   │   │   └── DocumentCard.tsx    # 문서 카드
│   │   └── calendar/
│   │       └── Calendar.tsx        # 캘린더 컴포넌트
│   ├── context/
│   │   └── ToastContext.tsx        # 토스트 알림 Context
│   ├── hooks/
│   │   └── useAutoSave.ts          # 자동 저장 훅
│   ├── lib/
│   │   ├── db.ts                   # IndexedDB 서비스 레이어
│   │   └── types.ts                # TypeScript 타입 정의
│   └── styles/
│       ├── design-system.css       # 디자인 토큰, 기본 스타일
│       ├── components.css          # UI 컴포넌트 스타일
│       └── layout.css              # 레이아웃, 네비게이션, 반응형
├── public/                         # 정적 파일
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 3. Data Model

### 3.1 Document Schema (IndexedDB)
```typescript
interface Document {
  id: string;           // "doc_{timestamp}_{random}" 형식
  title: string;        // 문서 제목
  content: string;      // 마크다운 원본 텍스트
  date: number;         // 문서 날짜 (timestamp) - 캘린더 표시용
  createdAt: number;    // 생성일 (timestamp)
  updatedAt: number;    // 수정일 (timestamp)
}
```

### 3.2 IndexedDB 구조
- **Database Name**: `MDCalendarDB`
- **Version**: 1
- **Object Store**: `documents`
- **Indexes**: `date`, `createdAt`, `updatedAt`, `title`

### 3.3 db.ts 제공 함수
| 함수 | 설명 |
|------|------|
| `initDB()` | DB 초기화 |
| `createDocument(data)` | 새 문서 생성 |
| `getDocument(id)` | ID로 문서 조회 |
| `updateDocument(id, updates)` | 문서 수정 |
| `deleteDocument(id)` | 문서 삭제 |
| `getAllDocuments()` | 전체 문서 조회 (수정일 내림차순) |
| `getDocumentsForMonth(year, month)` | 특정 월의 문서 조회 |
| `searchDocuments(query)` | 제목/내용 검색 |
| `formatDate(timestamp)` | 날짜 포맷팅 |
| `formatDateTime(timestamp)` | 날짜+시간 포맷팅 |
| `getDateKey(timestamp)` | YYYY-MM-DD 형식 키 생성 |

---

## 4. Routing Structure

### 4.1 라우트 정의
| Route | Component | 설명 |
|-------|-----------|------|
| `/` | redirect → `/editor` | 루트 리다이렉트 |
| `/editor` | `Editor` | 새 문서 에디터 |
| `/editor/[id]` | `Editor` | 기존 문서 편집 |
| `/list` | `DocumentList` | 문서 목록 |
| `/calendar` | `Calendar` | 캘린더 뷰 |

### 4.2 네비게이션
- Next.js `<Link>` 컴포넌트 사용
- `usePathname()` 훅으로 active 상태 관리
- Header 컴포넌트에서 중앙 집중 관리

---

## 5. Design System (Neobrutalism)

### 5.1 핵심 디자인 원칙
- **굵은 테두리**: 3px solid black
- **하드 섀도우**: offset만 있고 blur 없음 (4px 4px 0)
- **볼드 컬러**: 원색 계열의 강렬한 색상
- **플레이풀 타이포그래피**: Space Grotesk (산세리프), Space Mono (모노스페이스)

### 5.2 Color Palette (CSS Variables)
```css
--color-primary: #FF6B6B;    /* 빨강 */
--color-secondary: #4ECDC4;  /* 민트 */
--color-accent: #FFE66D;     /* 노랑 */
--color-purple: #A06CD5;     /* 보라 */
--color-blue: #7EB6FF;       /* 파랑 */
--color-green: #7AE582;      /* 초록 */
--color-orange: #FFA552;     /* 주황 */
--color-bg: #FFFEF5;         /* 배경 (아이보리) */
--color-surface: #FFFFFF;    /* 표면 */
--color-border: #1A1A1A;     /* 테두리 (검정) */
```

### 5.3 주요 컴포넌트 스타일
- `.btn`: 버튼 (hover시 translate + shadow 증가)
- `.card`: 카드 컨테이너
- `.input`: 입력 필드
- `.toast`: 토스트 알림
- `.modal`: 모달 다이얼로그

---

## 6. Component Details

### 6.1 Editor Component
**기능:**
- 실시간 마크다운 프리뷰 (marked + highlight.js)
- 툴바 (Bold, Italic, Heading, Link, Code, List 등)
- 자동 저장 (2초 debounce, useAutoSave 훅)
- 새 문서 자동 생성 (첫 입력 시)
- Import/Export 기능

**주요 상태:**
- `currentDocId`: 현재 편집 중인 문서 ID
- `saveStatus`: 저장 상태 ('saved' | 'saving' | 'unsaved')
- `content`, `title`, `date`: 문서 데이터

### 6.2 DocumentList Component
**기능:**
- 문서 카드 그리드 표시
- 검색 (제목/내용, 300ms debounce)
- 문서별 Edit/Export/Delete 액션
- 벌크 Import (다중 파일)
- 빈 상태 UI

### 6.3 Calendar Component
**기능:**
- 월별 캘린더 그리드
- 날짜별 문서 표시 (최대 3개 + more)
- 이전/다음 월 네비게이션
- Today 버튼
- 날짜 클릭 시 에디터로 이동 (date 파라미터 전달)

---

## 7. Dependencies

### 7.1 npm packages
```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "marked": "^12.x",
    "highlight.js": "^11.x",
    "dompurify": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/dompurify": "^3.x"
  }
}
```

### 7.2 CDN (Fonts & Styles)
```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

<!-- Highlight.js Theme -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
```

---

## 8. Known Issues & Limitations

| 이슈 | 상태 | 설명 |
|------|------|------|
| SSR hydration warning | ⚠️ Minor | IndexedDB는 클라이언트 전용, 초기 로드 시 경고 |
| 모바일 에디터 UX | ⚠️ Minor | 분할 화면이 세로로 변경되나 최적화 필요 |
| 오프라인 지원 | ❌ 미구현 | Service Worker 미적용 |
| 다크 모드 | ❌ 미구현 | 라이트 모드만 지원 |

---

## 9. Future Enhancement Ideas (고도화 방향)

### 9.1 기능 고도화
- [ ] **태그 시스템**: 문서에 태그 추가, 태그별 필터링
- [ ] **폴더/카테고리**: 문서 그룹화
- [ ] **검색 고도화**: 전문 검색, 정규식 지원
- [ ] **마크다운 확장**: Mermaid 다이어그램, 수학 수식 (KaTeX)
- [ ] **이미지 업로드**: Base64 또는 별도 저장소
- [ ] **버전 히스토리**: 문서 변경 이력 관리

### 9.2 UX 개선
- [ ] **다크 모드**: 테마 토글
- [ ] **키보드 단축키**: Ctrl+S 저장, Ctrl+B 볼드 등
- [ ] **드래그 앤 드롭**: 파일 드롭으로 Import
- [ ] **에디터 분할 비율 조절**: 드래그로 조절

### 9.3 기술적 개선
- [ ] **PWA 지원**: Service Worker, 오프라인 모드
- [ ] **테스트 추가**: Jest, Playwright E2E
- [ ] **클라우드 동기화**: Firebase, Supabase 연동

---

## 10. Development Guide

### 10.1 로컬 실행
```bash
cd /home/choi/demo/md_calendar
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 10.2 빌드 및 프로덕션
```bash
npm run build
npm start
```

### 10.3 코드 컨벤션
- TypeScript strict mode
- React 함수형 컴포넌트 + Hooks
- 'use client' 디렉티브 (클라이언트 컴포넌트)
- CSS 변수 활용 (디자인 토큰)
- 비동기 처리는 async/await

### 10.4 새 기능 추가 시
1. `src/components/`에 새 컴포넌트 파일 생성
2. `src/app/`에 라우트 페이지 추가
3. `src/styles/components.css`에 스타일 추가
4. 필요시 Header.tsx 네비게이션 수정

---

## 11. Quick Reference

### 11.1 주요 파일 역할
| 파일 | 한 줄 설명 |
|------|-----------|
| `src/app/layout.tsx` | 루트 레이아웃, Header, ToastProvider |
| `src/lib/db.ts` | IndexedDB CRUD |
| `src/lib/types.ts` | TypeScript 인터페이스 |
| `src/components/Header.tsx` | 네비게이션 헤더 |
| `src/components/editor/Editor.tsx` | 메인 에디터 |
| `src/hooks/useAutoSave.ts` | 자동 저장 훅 |
| `src/context/ToastContext.tsx` | 토스트 알림 |

### 11.2 자주 사용하는 패턴
```typescript
// 문서 생성
const doc = await createDocument({ title, content, date: Date.now() });

// 문서 수정
await updateDocument(id, { title, content });

// 라우팅
import { useRouter } from 'next/navigation';
router.push('/editor/' + docId);

// 토스트 표시
const { showToast } = useToast();
showToast('Message', 'success'); // success, error, info
```

---

**Last Updated**: 2026-02-02  
**Tech Stack**: Next.js 14+ / TypeScript / IndexedDB
