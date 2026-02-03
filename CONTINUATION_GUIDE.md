# MD Calendar - Session Continuation Guide

> 다른 세션에서 본 프로젝트 작업을 이어가기 위한 가이드입니다.

---

## 1. 프로젝트 실행 방법

### 1.1 실행 파일 사용 (권장)

```bash
# AppImage 실행 (Linux)
cd /home/choi/demo/md_calendar
./src-tauri/target/release/bundle/appimage/MD\ Calendar_0.1.0_amd64.AppImage
```

### 1.2 개발 모드

```bash
# 프로젝트 디렉토리로 이동
cd /home/choi/demo/md_calendar

# 의존성 설치 (최초 1회)
npm install

# Tauri 개발 모드 실행
npm run tauri:dev
```

### 1.3 프로덕션 빌드

```bash
# 빌드
npm run tauri:build

# 결과물 위치
# - AppImage: src-tauri/target/release/bundle/appimage/
# - .deb: src-tauri/target/release/bundle/deb/
# - .rpm: src-tauri/target/release/bundle/rpm/
```

### 1.4 시스템 요구사항 (Linux)

```bash
# Tauri 빌드에 필요한 시스템 라이브러리
sudo apt-get install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev patchelf
```

### 1.5 실행 확인 체크리스트

```
[ ] 앱 창이 열림 (1200x800)
[ ] "MD Calendar" 헤더가 표시됨
[ ] Editor, Documents, Calendar, Settings 탭이 보임
[ ] 에디터 화면이 좌/우 분할로 표시됨
[ ] 마크다운 입력 시 우측에 프리뷰 표시됨
[ ] Settings에서 폴더 선택 가능
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
Rust 백엔드도 필요하면 수정해줘.
```

### 3.2 버그 수정

```
/home/choi/demo/md_calendar 프로젝트의 버그를 수정해줘.

PROJECT_META.md를 확인하고,
[특정 버그 설명] 문제를 해결해줘.
```

### 3.3 UI/UX 개선

```
/home/choi/demo/md_calendar 프로젝트에 다크 모드를 추가해줘.

PROJECT_META.md를 읽고 기존 디자인 시스템(네오브루탈리즘)을 
유지하면서 다크 테마 CSS 변수와 토글 기능을 구현해줘.
```

---

## 4. 컨텍스트 파악 체크리스트

새 세션에서 에이전트가 확인해야 할 항목:

### 4.1 필수 파일 읽기
```
1. PROJECT_META.md - 전체 프로젝트 개요
2. src/lib/db.ts - Tauri invoke wrapper
3. src/lib/types.ts - TypeScript 타입 정의
4. src-tauri/src/lib.rs - Rust 백엔드 명령어
5. src/styles/design-system.css - 디자인 토큰
```

### 4.2 구조 파악 명령
```bash
# 프로젝트 구조 확인
ls -la src/
ls -la src/components/
ls -la src/app/
ls -la src-tauri/src/

# 개발 서버 실행
npm run tauri:dev
```

---

## 5. 주요 확장 포인트

### 5.1 새 컴포넌트 추가 시
```
1. src/components/[name]/[Name].tsx 생성
2. 'use client' 디렉티브 추가 (클라이언트 컴포넌트인 경우)
3. src/app/[route]/page.tsx에서 import하여 사용
4. src/styles/components.css 또는 layout.css에 스타일 추가
5. 필요시 Header.tsx 네비게이션 메뉴 추가
```

### 5.2 Rust 백엔드 명령어 추가 시
```
1. src-tauri/src/lib.rs에 #[tauri::command] 함수 추가
2. run()의 invoke_handler에 함수 등록
3. src/lib/db.ts에 Tauri invoke wrapper 함수 추가
4. 필요시 capabilities/default.json에 권한 추가
```

### 5.3 데이터 모델 변경 시
```
1. src/lib/types.ts의 Document 인터페이스 수정
2. src-tauri/src/lib.rs의 Document struct 수정
3. .meta.json 파일 구조 업데이트 고려
4. 기존 파일 마이그레이션 로직 추가 (필요시)
```

### 5.4 디자인 수정 시
```
1. src/styles/design-system.css의 CSS 변수 활용
2. 네오브루탈리즘 원칙 유지:
   - 굵은 테두리 (3px solid)
   - 하드 섀도우 (blur 없음)
   - 볼드 컬러
```

### 5.5 새 라우트 추가 시
```
1. src/app/[route]/page.tsx 생성
2. 'use client' 추가 (클라이언트 기능 필요시)
3. Header.tsx에 네비게이션 링크 추가
4. layout.css에 .view-[route] 스타일 추가
```

---

## 6. 테스트 및 검증

### 6.1 앱 실행 테스트
```bash
# 빌드된 앱 실행
./src-tauri/target/release/bundle/appimage/MD\ Calendar_0.1.0_amd64.AppImage

# 또는 개발 모드
npm run tauri:dev
```

### 6.2 수동 테스트 체크리스트
```
[ ] 에디터: 마크다운 입력 → 실시간 프리뷰
[ ] 에디터: 자동 저장 동작 (2초 후)
[ ] 에디터: Import/Export 기능
[ ] 목록: 문서 카드 표시
[ ] 목록: 검색 기능
[ ] 목록: 삭제 기능 (확인 모달)
[ ] 캘린더: 월 네비게이션
[ ] 캘린더: 날짜별 문서 표시
[ ] 캘린더: 클릭 시 에디터 이동
[ ] 설정: 폴더 선택 다이얼로그
[ ] 설정: 폴더 변경 후 문서 저장 확인
[ ] 네비게이션: 모든 라우트 동작
```

### 6.3 빌드 검증
```bash
# Next.js 빌드
npm run build

# Tauri 빌드
npm run tauri:build
```

---

## 7. 트러블슈팅

### 7.1 일반적인 문제

| 문제 | 해결 방법 |
|------|----------|
| 모듈 not found | `npm install` 실행 |
| Tauri 빌드 실패 | 시스템 라이브러리 설치 확인 |
| Rust 컴파일 에러 | `cargo check` 로 상세 에러 확인 |
| 파일 저장 안됨 | Settings에서 폴더 권한 확인 |
| 폴더 선택 안됨 | capabilities/default.json 권한 확인 |

### 7.2 Rust 빌드 문제
```bash
# Cargo 캐시 정리
cd src-tauri
cargo clean
cargo build
```

### 7.3 Next.js 캐시 문제
```bash
# .next, out 폴더 삭제 후 재빌드
rm -rf .next out
npm run build
```

### 7.4 저장 폴더 초기화
```bash
# 설정 파일 삭제 (기본 폴더로 복원)
rm ~/.local/share/com.mdcalendar.app/config.json
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
6. [ ] 검색 하이라이트
```

### Phase 3: 기술 고도화
```
7. [ ] E2E 테스트 (Playwright)
8. [ ] 성능 최적화
9. [ ] 자동 업데이트
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

### 9.2 기술 문서
- [Tauri Documentation](https://tauri.app/v2/guides/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [marked.js](https://marked.js.org/) - 마크다운 파서
- [highlight.js](https://highlightjs.org/) - 코드 하이라이팅

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
- Tauri 2.x 데스크톱 앱 (Rust 백엔드)
- Next.js 16+ (Static Export)
- 로컬 파일 시스템에 .md 저장
- 네오브루탈리즘 디자인

## 이번 작업 목표
[여기에 구체적인 작업 내용 작성]

## 요구사항
- 기존 코드 패턴 유지
- TypeScript + Rust 타입 안전성 유지
- 네오브루탈리즘 디자인 시스템 준수
- 빌드 성공 확인

ulw ulw
```

---

**Last Updated**: 2026-02-03  
**Tech Stack**: Tauri 2.x / Next.js 16+ / TypeScript / Rust
