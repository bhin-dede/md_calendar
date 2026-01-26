# MD Calendar - Session Continuation Guide

> 다른 세션에서 본 프로젝트 작업을 이어가기 위한 가이드입니다.

---

## 1. 프로젝트 실행 방법

### 1.1 로컬 서버 실행 (필수)

이 프로젝트는 ES Modules를 사용하므로 **반드시 HTTP 서버**를 통해 실행해야 합니다.
(`file://` 프로토콜로는 CORS 오류 발생)

```bash
# 프로젝트 디렉토리로 이동
cd /home/choi/demo/md_calendar

# Python HTTP 서버 실행 (포트 8080)
python3 -m http.server 8080

# 또는 다른 포트 사용
python3 -m http.server 3000
```

### 1.2 브라우저에서 접속

```
http://localhost:8080
```

### 1.3 대안 실행 방법

```bash
# Node.js http-server 사용 (설치 필요: npm install -g http-server)
cd /home/choi/demo/md_calendar
http-server -p 8080

# VS Code Live Server 확장 사용
# index.html 우클릭 → "Open with Live Server"

# PHP 내장 서버 사용
cd /home/choi/demo/md_calendar
php -S localhost:8080
```

### 1.4 서버 종료

```bash
# Python 서버 종료 (백그라운드 실행 시)
pkill -f "python3 -m http.server"

# 또는 터미널에서 Ctrl+C
```

### 1.5 실행 확인 체크리스트

```
[ ] 브라우저에서 http://localhost:8080 접속
[ ] "MD Calendar" 헤더가 표시됨
[ ] 에디터 화면이 좌/우 분할로 표시됨
[ ] 콘솔에 "Database initialized" 메시지 확인
[ ] 마크다운 입력 시 우측에 프리뷰 표시됨
```

---

## 2. Quick Start (빠른 시작)

### 2.1 기본 프롬프트 템플릿

새 세션에서 아래 프롬프트를 사용하세요:

```
/home/choi/demo/md_calendar 프로젝트의 고도화 작업을 진행합니다.

먼저 PROJECT_META.md 파일을 읽고 프로젝트 컨텍스트를 파악한 후,
[원하는 작업 내용]을 진행해주세요.
```

### 2.2 ULTRAWORK 모드 사용 시

복잡한 기능 추가나 대규모 리팩토링 시:

```
ulw ulw

/home/choi/demo/md_calendar 프로젝트 고도화.

1. PROJECT_META.md 읽고 컨텍스트 파악
2. [원하는 작업 내용]

ulw ulw
```

---

## 3. 작업 유형별 프롬프트 예시

### 3.1 새 기능 추가

```
/home/choi/demo/md_calendar 프로젝트에 태그 시스템을 추가해줘.

PROJECT_META.md를 먼저 읽고:
- 문서에 태그 추가/삭제 기능
- 태그별 필터링
- 태그 자동완성

기존 코드 패턴과 디자인 시스템을 따라서 구현해줘.
```

### 3.2 버그 수정

```
/home/choi/demo/md_calendar 프로젝트의 버그를 수정해줘.

PROJECT_META.md의 "Known Issues" 섹션을 확인하고,
[특정 버그 설명] 문제를 해결해줘.
```

### 3.3 UI/UX 개선

```
/home/choi/demo/md_calendar 프로젝트에 다크 모드를 추가해줘.

PROJECT_META.md를 읽고 기존 디자인 시스템(네오브루탈리즘)을 
유지하면서 다크 테마 CSS 변수와 토글 기능을 구현해줘.
```

### 3.4 성능 최적화

```
/home/choi/demo/md_calendar 프로젝트의 성능을 최적화해줘.

PROJECT_META.md를 읽고:
- 문서 목록 가상 스크롤 적용
- 마크다운 파싱 debounce 최적화
- 불필요한 리렌더링 제거
```

### 3.5 기술 스택 변경

```
ulw ulw

/home/choi/demo/md_calendar 프로젝트를 TypeScript로 마이그레이션해줘.

PROJECT_META.md를 읽고:
1. 현재 Vanilla JS 구조 파악
2. TypeScript 설정 추가
3. 모든 .js 파일을 .ts로 변환
4. 타입 정의 추가

기존 기능이 모두 동작하는지 검증까지 진행해줘.

ulw ulw
```

---

## 4. 컨텍스트 파악 체크리스트

새 세션에서 에이전트가 확인해야 할 항목:

### 4.1 필수 파일 읽기
```
1. PROJECT_META.md - 전체 프로젝트 개요
2. js/db.js - 데이터 모델 및 API
3. js/app.js - 앱 구조 및 라우팅
4. css/design-system.css - 디자인 토큰
```

### 4.2 구조 파악 명령
```bash
# 프로젝트 구조 확인
find /home/choi/demo/md_calendar -type f -name "*.js" -o -name "*.css" -o -name "*.html"

# 로컬 서버 실행
cd /home/choi/demo/md_calendar && python3 -m http.server 8080
```

---

## 5. 주요 확장 포인트

### 5.1 새 컴포넌트 추가 시
```
1. js/components/[name].js 생성
2. export function render[Name](container, params) 형태로 작성
3. js/app.js에서 import 및 라우트 등록
4. css/components.css에 스타일 추가
5. 필요시 index.html 네비게이션 메뉴 추가
```

### 5.2 DB 스키마 변경 시
```
1. js/db.js의 DB_VERSION 증가
2. onupgradeneeded에서 마이그레이션 로직 추가
3. 새 인덱스나 필드 정의
4. 관련 CRUD 함수 추가/수정
```

### 5.3 디자인 수정 시
```
1. css/design-system.css의 CSS 변수 활용
2. 네오브루탈리즘 원칙 유지:
   - 굵은 테두리 (3px solid)
   - 하드 섀도우 (blur 없음)
   - 볼드 컬러
```

---

## 6. 테스트 및 검증

### 6.1 Playwright 테스트 실행
```
# 서버 시작
cd /home/choi/demo/md_calendar && python3 -m http.server 8080 &

# Playwright로 테스트
browser_navigate: http://localhost:8080
browser_snapshot: 현재 상태 확인
browser_click/type: 기능 테스트
```

### 6.2 수동 테스트 체크리스트
```
[ ] 에디터: 마크다운 입력 → 실시간 프리뷰
[ ] 에디터: 자동 저장 동작 (2초 후)
[ ] 에디터: Import/Export 기능
[ ] 목록: 문서 카드 표시
[ ] 목록: 검색 기능
[ ] 목록: 삭제 기능
[ ] 캘린더: 월 네비게이션
[ ] 캘린더: 날짜별 문서 표시
[ ] 캘린더: 클릭 시 에디터 이동
[ ] 네비게이션: 모든 라우트 동작
```

---

## 7. 트러블슈팅

### 7.1 일반적인 문제

| 문제 | 해결 방법 |
|------|----------|
| 모듈 로드 실패 | HTTP 서버로 실행 (file:// 프로토콜 불가) |
| IndexedDB 에러 | 브라우저 DevTools > Application > IndexedDB 확인 |
| 스타일 미적용 | CSS 파일 경로 및 캐시 확인 |
| 라우팅 안됨 | Hash (#) 포함 여부 확인 |

### 7.2 DB 초기화 (개발용)
```javascript
// 브라우저 콘솔에서 실행
indexedDB.deleteDatabase('MDCalendarDB');
location.reload();
```

---

## 8. 고도화 우선순위 제안

### Phase 1: 핵심 기능 강화
```
1. [ ] 태그 시스템
2. [ ] 키보드 단축키
3. [ ] 드래그 앤 드롭 Import
```

### Phase 2: UX 개선
```
4. [ ] 다크 모드
5. [ ] 에디터 분할 비율 조절
6. [ ] 무한 스크롤/페이지네이션
```

### Phase 3: 기술 고도화
```
7. [ ] TypeScript 마이그레이션
8. [ ] PWA 지원 (오프라인)
9. [ ] 테스트 코드 추가
```

### Phase 4: 확장 기능
```
10. [ ] 클라우드 동기화
11. [ ] 버전 히스토리
12. [ ] 마크다운 확장 (Mermaid, KaTeX)
```

---

## 9. 참고 자료

### 9.1 프로젝트 문서
- `PROJECT_META.md` - 전체 메타 정보
- `CONTINUATION_GUIDE.md` - 이 문서

### 9.2 외부 라이브러리 문서
- [marked.js](https://marked.js.org/) - 마크다운 파서
- [highlight.js](https://highlightjs.org/) - 코드 하이라이팅
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS 방어

### 9.3 디자인 참고
- [Neobrutalism UI](https://hype4.academy/tools/neobrutalism-generator)
- [Space Grotesk Font](https://fonts.google.com/specimen/Space+Grotesk)

---

## 10. 예시: 전체 세션 시작 프롬프트

```
ulw ulw

/home/choi/demo/md_calendar 프로젝트 고도화 작업.

## 컨텍스트
- PROJECT_META.md 파일 참조
- 웹 기반 마크다운 에디터 + 캘린더 앱
- Vanilla JS + IndexedDB + 네오브루탈리즘 디자인

## 이번 작업 목표
[여기에 구체적인 작업 내용 작성]

## 요구사항
- 기존 코드 패턴 유지
- 네오브루탈리즘 디자인 시스템 준수
- Playwright로 기능 검증

ulw ulw
```

---

**Last Updated**: 2026-01-23
