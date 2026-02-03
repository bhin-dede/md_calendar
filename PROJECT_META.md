# MD Calendar - Project Meta Information

> **For Sisyphus Agent**: 이 문서는 프로젝트 컨텍스트를 빠르게 파악하고 고도화 작업을 이어서 진행하기 위한 메타정보입니다.

---

## 1. Project Overview

### 1.1 프로젝트 목적
Tauri 기반 데스크톱 마크다운 뷰어/에디터 애플리케이션으로, 사용자가 마크다운 문서를 작성하고 관리하며 캘린더 형태로 시각화할 수 있는 도구입니다.

### 1.2 핵심 요구사항 (Original Requirements)
| 요구사항 | 구현 상태 |
|---------|----------|
| 화면 분할 (좌: 에디터, 우: 프리뷰) | ✅ 완료 |
| MD 파일 Import/Export | ✅ 완료 |
| MD 리스트 관리 기능 | ✅ 완료 |
| 네오브루탈리즘 디자인 | ✅ 완료 |
| 로컬 파일 저장 (.md) | ✅ 완료 |
| 캘린더 보기 (날짜 기준 표시) | ✅ 완료 |
| 저장 폴더 지정 기능 | ✅ 완료 |

### 1.3 기술적 결정사항
- **데스크톱 프레임워크**: Tauri 2.x (Rust backend)
- **프론트엔드**: Next.js 16+ (App Router, Static Export)
- **언어**: TypeScript + Rust
- **마크다운 파싱**: marked (npm)
- **코드 하이라이팅**: highlight.js (npm)
- **XSS 방어**: DOMPurify (npm, dynamic import)
- **데이터 저장**: 로컬 파일 시스템 (.md + .meta.json)
- **라우팅**: Next.js App Router (query params for dynamic routes)
- **디자인**: Neobrutalism (네오브루탈리즘)

---

## 2. Project Structure

```
md_calendar/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (Header, ToastProvider)
│   │   ├── page.tsx                # 루트 페이지 (→ /editor 리다이렉트)
│   │   ├── editor/page.tsx         # 에디터 (?id=xxx로 문서 편집)
│   │   ├── list/page.tsx           # 문서 목록
│   │   ├── calendar/page.tsx       # 캘린더 뷰
│   │   └── settings/page.tsx       # 설정 (폴더 선택)
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
│   │   ├── db.ts                   # Tauri invoke wrapper (파일 CRUD)
│   │   └── types.ts                # TypeScript 타입 정의
│   └── styles/
│       ├── design-system.css       # 디자인 토큰, 기본 스타일
│       ├── components.css          # UI 컴포넌트 스타일
│       └── layout.css              # 레이아웃, 네비게이션, 반응형
├── src-tauri/
│   ├── src/lib.rs                  # Rust 백엔드 (파일 시스템 명령어)
│   ├── Cargo.toml                  # Rust 의존성
│   ├── tauri.conf.json             # Tauri 설정
│   ├── capabilities/default.json   # 권한 설정 (fs, dialog)
│   └── icons/                      # 앱 아이콘
├── out/                            # Next.js static export 결과물
├── package.json
├── tsconfig.json
└── next.config.ts                  # output: 'export' 설정
```

---

## 3. Data Model

### 3.1 Document Schema (File-based)
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

### 3.2 파일 저장 구조
```
저장폴더/
├── doc_1234567890_abc12.md         # 마크다운 내용
├── doc_1234567890_abc12.meta.json  # 메타데이터 (title, date, createdAt, updatedAt)
└── ...
```

### 3.3 설정 파일
```
~/.local/share/com.mdcalendar.app/config.json
{
  "documentsFolder": "/path/to/custom/folder"  // null이면 기본 위치 사용
}
```

### 3.4 db.ts 제공 함수 (Tauri invoke wrapper)
| 함수 | 설명 |
|------|------|
| `createDocument(data)` | 새 문서 생성 |
| `getDocument(id)` | ID로 문서 조회 |
| `updateDocument(id, updates)` | 문서 수정 |
| `deleteDocument(id)` | 문서 삭제 |
| `getAllDocuments()` | 전체 문서 조회 (수정일 내림차순) |
| `getDocumentsForMonth(year, month)` | 특정 월의 문서 조회 |
| `searchDocuments(query)` | 제목/내용 검색 |
| `getDocumentsFolder()` | 현재 저장 폴더 경로 조회 |
| `setDocumentsFolder(folder)` | 저장 폴더 경로 설정 |
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
| `/editor?id=xxx` | `Editor` | 기존 문서 편집 |
| `/list` | `DocumentList` | 문서 목록 |
| `/calendar` | `Calendar` | 캘린더 뷰 |
| `/settings` | `Settings` | 설정 (폴더 선택) |

### 4.2 네비게이션
- Next.js `<Link>` 컴포넌트 사용
- `usePathname()` 훅으로 active 상태 관리
- `useSearchParams()`로 쿼리 파라미터 처리
- Header 컴포넌트에서 중앙 집중 관리

---

## 5. Tauri Backend (Rust)

### 5.1 Rust 명령어 (src-tauri/src/lib.rs)
| Command | 파라미터 | 설명 |
|---------|----------|------|
| `create_document` | title, content, date | 새 문서 생성 |
| `get_document` | id | 문서 조회 |
| `update_document` | id, title?, content?, date? | 문서 수정 |
| `delete_document` | id | 문서 삭제 |
| `get_all_documents` | - | 전체 문서 조회 |
| `get_documents_for_month` | year, month | 월별 문서 조회 |
| `search_documents` | query | 검색 |
| `get_documents_folder` | - | 저장 폴더 조회 |
| `set_documents_folder` | folder | 저장 폴더 설정 |

### 5.2 Tauri 플러그인
- `tauri-plugin-fs`: 파일 시스템 접근
- `tauri-plugin-dialog`: 폴더 선택 다이얼로그
- `tauri-plugin-log`: 로깅

### 5.3 권한 설정 (capabilities/default.json)
```json
{
  "permissions": [
    "core:default",
    "fs:default", "fs:allow-read", "fs:allow-write",
    "dialog:default", "dialog:allow-open",
    { "identifier": "fs:scope", "allow": ["$APPDATA/**", "$HOME/**"] }
  ]
}
```

---

## 6. Design System (Neobrutalism)

### 6.1 핵심 디자인 원칙
- **굵은 테두리**: 3px solid black
- **하드 섀도우**: offset만 있고 blur 없음 (4px 4px 0)
- **볼드 컬러**: 원색 계열의 강렬한 색상
- **플레이풀 타이포그래피**: Space Grotesk (산세리프), Space Mono (모노스페이스)

### 6.2 Color Palette (CSS Variables)
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

---

## 7. Dependencies

### 7.1 npm packages
```json
{
  "dependencies": {
    "next": "^16.x",
    "react": "^19.x",
    "@tauri-apps/api": "^2.x",
    "@tauri-apps/plugin-fs": "^2.x",
    "@tauri-apps/plugin-dialog": "^2.x",
    "marked": "^17.x",
    "highlight.js": "^11.x",
    "dompurify": "^3.x"
  }
}
```

### 7.2 Rust crates (Cargo.toml)
```toml
[dependencies]
tauri = "2.10"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-log = "2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4"] }
```

---

## 8. Development Guide

### 8.1 개발 모드 실행
```bash
cd /home/choi/demo/md_calendar
npm install
npm run tauri:dev
```

### 8.2 프로덕션 빌드
```bash
npm run tauri:build
# 결과물: src-tauri/target/release/bundle/
```

### 8.3 시스템 요구사항 (Linux)
```bash
sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev
```

### 8.4 코드 컨벤션
- TypeScript strict mode
- React 함수형 컴포넌트 + Hooks
- 'use client' 디렉티브 (클라이언트 컴포넌트)
- CSS 변수 활용 (디자인 토큰)
- Tauri invoke로 Rust 백엔드 호출

---

## 9. Quick Reference

### 9.1 주요 파일 역할
| 파일 | 한 줄 설명 |
|------|-----------|
| `src/app/layout.tsx` | 루트 레이아웃, Header, ToastProvider |
| `src/lib/db.ts` | Tauri invoke wrapper (파일 CRUD) |
| `src/lib/types.ts` | TypeScript 인터페이스 |
| `src/components/Header.tsx` | 네비게이션 헤더 |
| `src/components/editor/Editor.tsx` | 메인 에디터 |
| `src/app/settings/page.tsx` | 폴더 선택 설정 |
| `src-tauri/src/lib.rs` | Rust 백엔드 (파일 시스템 명령어) |

### 9.2 자주 사용하는 패턴
```typescript
// Tauri invoke 사용
import { invoke } from '@tauri-apps/api/core';
const doc = await invoke<Document>('create_document', { title, content, date });

// 폴더 선택 다이얼로그
import { open } from '@tauri-apps/plugin-dialog';
const folder = await open({ directory: true });

// 라우팅 (쿼리 파라미터)
router.push(`/editor?id=${docId}`);

// 토스트 표시
const { showToast } = useToast();
showToast('저장되었습니다', 'success');
```

---

**Last Updated**: 2026-02-03  
**Tech Stack**: Tauri 2.x / Next.js 16+ / TypeScript / Rust
