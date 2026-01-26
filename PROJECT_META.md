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
| IndexedDB/localStorage 데이터 관리 | ✅ IndexedDB 사용 |
| 캘린더 보기 (날짜 기준 표시) | ✅ 완료 |

### 1.3 기술적 결정사항
- **프레임워크**: Vanilla JS (ES6 Modules) - 빌드 도구 없이 브라우저에서 직접 실행
- **마크다운 파싱**: marked.js (GFM 지원)
- **코드 하이라이팅**: highlight.js
- **XSS 방어**: DOMPurify
- **데이터 저장**: IndexedDB (비동기, 대용량 지원)
- **라우팅**: Hash-based routing (#/editor, #/list, #/calendar)
- **디자인**: Neobrutalism (네오브루탈리즘)

---

## 2. Project Structure

```
md_calendar/
├── index.html                 # 메인 HTML (SPA 엔트리포인트)
├── PROJECT_META.md            # 이 문서
├── css/
│   ├── design-system.css      # 디자인 토큰, 기본 스타일, 유틸리티
│   ├── components.css         # UI 컴포넌트 스타일
│   └── layout.css             # 레이아웃, 네비게이션, 반응형
└── js/
    ├── app.js                 # 앱 초기화, 토스트, 모달, 라우터 설정
    ├── db.js                  # IndexedDB 서비스 레이어
    ├── router.js              # Hash-based 라우터
    └── components/
        ├── editor.js          # 마크다운 에디터 컴포넌트
        ├── document-list.js   # 문서 목록 컴포넌트
        └── calendar.js        # 캘린더 뷰 컴포넌트
```

---

## 3. Data Model

### 3.1 Document Schema (IndexedDB)
```javascript
{
  id: string,           // "doc_{timestamp}_{random}" 형식
  title: string,        // 문서 제목
  content: string,      // 마크다운 원본 텍스트
  date: number,         // 문서 날짜 (timestamp) - 캘린더 표시용
  createdAt: number,    // 생성일 (timestamp)
  updatedAt: number     // 수정일 (timestamp)
}
```

### 3.2 IndexedDB 구조
- **Database Name**: `MDCalendarDB`
- **Version**: 1
- **Object Store**: `documents`
- **Indexes**: `date`, `createdAt`, `updatedAt`, `title`

### 3.3 db.js 제공 함수
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
| `#/editor` | `renderEditor()` | 새 문서 에디터 |
| `#/editor/:id` | `renderEditor({id})` | 기존 문서 편집 |
| `#/list` | `renderDocumentList()` | 문서 목록 |
| `#/calendar` | `renderCalendar()` | 캘린더 뷰 |

### 4.2 라우터 구현 (router.js)
- Hash 기반 SPA 라우팅
- `window.hashchange` 이벤트 리스닝
- 네비게이션 링크 active 상태 자동 관리
- `router.navigate(path)` 메서드로 프로그래매틱 네비게이션

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

### 6.1 Editor Component (editor.js)
**기능:**
- 실시간 마크다운 프리뷰 (marked.js)
- 툴바 (Bold, Italic, Heading, Link, Code, List 등)
- 자동 저장 (2초 debounce)
- 새 문서 자동 생성 (첫 입력 시)
- Import/Export 기능

**주요 변수:**
- `currentDocId`: 현재 편집 중인 문서 ID
- `saveTimeout`: 자동 저장 타이머
- `lastSavedContent`: 마지막 저장된 내용

### 6.2 Document List Component (document-list.js)
**기능:**
- 문서 카드 그리드 표시
- 검색 (제목/내용)
- 문서별 Edit/Export/Delete 액션
- 벌크 Import (다중 파일)
- 빈 상태 UI

### 6.3 Calendar Component (calendar.js)
**기능:**
- 월별 캘린더 그리드
- 날짜별 문서 표시 (최대 3개 + more)
- 이전/다음 월 네비게이션
- Today 버튼
- 날짜 클릭 시 에디터로 이동

---

## 7. External Dependencies (CDN)

```html
<!-- Markdown -->
<script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>

<!-- Syntax Highlighting -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">

<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

---

## 8. Known Issues & Limitations

| 이슈 | 상태 | 설명 |
|------|------|------|
| 문서 중복 생성 | ⚠️ Minor | 빠른 입력 시 여러 문서가 생성될 수 있음 |
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
- [ ] **공유 기능**: URL 공유, 읽기 전용 뷰

### 9.2 UX 개선
- [ ] **다크 모드**: 테마 토글
- [ ] **키보드 단축키**: Ctrl+S 저장, Ctrl+B 볼드 등
- [ ] **드래그 앤 드롭**: 파일 드롭으로 Import
- [ ] **무한 스크롤**: 문서 목록 페이지네이션
- [ ] **에디터 분할 비율 조절**: 드래그로 조절

### 9.3 기술적 개선
- [ ] **PWA 지원**: Service Worker, 오프라인 모드
- [ ] **TypeScript 마이그레이션**: 타입 안전성
- [ ] **테스트 추가**: 단위 테스트, E2E 테스트
- [ ] **빌드 시스템**: Vite 또는 esbuild 도입
- [ ] **클라우드 동기화**: Firebase, Supabase 연동

### 9.4 성능 최적화
- [ ] **가상 스크롤**: 대량 문서 목록 성능
- [ ] **Lazy Loading**: 컴포넌트 지연 로딩
- [ ] **Web Worker**: 마크다운 파싱 백그라운드 처리

---

## 10. Development Guide

### 10.1 로컬 실행
```bash
cd /home/choi/demo/md_calendar
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

### 10.2 코드 컨벤션
- ES6+ 문법 사용
- ES Modules (import/export)
- 함수형 컴포넌트 패턴 (DOM 요소 반환)
- CSS 변수 활용 (디자인 토큰)
- 비동기 처리는 async/await

### 10.3 새 기능 추가 시
1. `js/components/`에 새 컴포넌트 파일 생성
2. `js/app.js`에서 import 및 라우트 등록
3. `css/components.css`에 스타일 추가
4. 네비게이션 필요시 `index.html` nav 메뉴 수정

### 10.4 DB 스키마 변경 시
1. `js/db.js`의 `DB_VERSION` 증가
2. `onupgradeneeded`에서 마이그레이션 로직 추가
3. 새 인덱스나 필드 추가

---

## 11. Session Context (마지막 작업 상태)

### 11.1 완료된 작업
- 전체 기본 기능 구현 완료
- Playwright를 통한 브라우저 테스트 완료
- 모든 뷰 (Editor, List, Calendar) 정상 작동 확인

### 11.2 테스트 결과
- ✅ 마크다운 실시간 렌더링
- ✅ 문서 자동 생성 및 저장
- ✅ 문서 목록 표시
- ✅ 캘린더 날짜별 문서 표시
- ✅ 네비게이션 작동

### 11.3 다음 세션 권장 작업
1. **버그 수정**: 문서 중복 생성 이슈 해결
2. **태그 시스템 추가**: 가장 요청 많을 기능
3. **다크 모드**: 사용성 향상
4. **키보드 단축키**: 파워 유저 지원

---

## 12. Quick Reference

### 12.1 주요 파일 역할
| 파일 | 한 줄 설명 |
|------|-----------|
| `index.html` | SPA 엔트리, CDN 로드, 네비게이션 |
| `css/design-system.css` | CSS 변수, 기본 스타일, 버튼/카드 |
| `css/components.css` | 에디터, 캘린더, 모달 스타일 |
| `css/layout.css` | 헤더, 컨테이너, 반응형 |
| `js/app.js` | 초기화, 토스트, 모달, 라우트 설정 |
| `js/db.js` | IndexedDB CRUD |
| `js/router.js` | Hash 라우팅 |
| `js/components/editor.js` | 에디터 + 툴바 + 프리뷰 |
| `js/components/document-list.js` | 문서 목록 + 검색 |
| `js/components/calendar.js` | 월별 캘린더 |

### 12.2 자주 사용하는 패턴
```javascript
// 문서 생성
const doc = await createDocument({ title, content, date: Date.now() });

// 문서 수정
await updateDocument(id, { title, content });

// 라우팅
router.navigate('/editor/' + docId);

// 토스트 표시
showToast('Message', 'success'); // success, error, info
```

---

**Last Updated**: 2026-01-23  
**Created By**: Sisyphus Agent (ULTRAWORK MODE)
