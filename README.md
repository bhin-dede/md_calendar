# MD Calendar

> 데스크톱 마크다운 에디터 & 캘린더 애플리케이션

![Tauri](https://img.shields.io/badge/Tauri-2.x-blue)
![Next.js](https://img.shields.io/badge/Next.js-16+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Design](https://img.shields.io/badge/Design-Neobrutalism-FF6B6B)
![Storage](https://img.shields.io/badge/Storage-Local%20Files-4ECDC4)

## Features

- **Split Editor** - 좌측 마크다운 에디터, 우측 실시간 프리뷰
- **Fullscreen Preview** - 프리뷰 전체화면 모드 지원
- **Interactive Checkboxes** - 프리뷰에서 체크리스트 직접 체크 가능
- **Auto Save** - 2초 디바운스 자동 저장
- **Local File Storage** - 로컬 폴더에 .md 파일로 저장
- **Custom Folder** - 저장 폴더 직접 지정 가능
- **Import/Export** - .md 파일 가져오기/내보내기
- **Document List** - 문서 목록 관리 및 검색
- **Calendar View** - 날짜별 문서 시각화 (기본 시작 화면)
- **Neobrutalism UI** - 모던하고 독특한 디자인
- **Desktop App** - Tauri 기반 크로스 플랫폼 데스크톱 앱

## Download

### Linux (AppImage)

[![Download AppImage](https://img.shields.io/badge/Download-AppImage-blue?style=for-the-badge&logo=linux)](https://github.com/bhin-dede/md_calendar/releases/latest/download/MD.Calendar_0.2.0_amd64.AppImage)

**[MD Calendar_0.2.0_amd64.AppImage](https://github.com/bhin-dede/md_calendar/releases/latest/download/MD.Calendar_0.2.0_amd64.AppImage)** (77MB)

### 실행 조건

| 조건 | 설명 |
|------|------|
| OS | Linux (x86_64) |
| 필수 라이브러리 | libwebkit2gtk-4.1-0 |

```bash
# Ubuntu/Debian - 필수 라이브러리 설치
sudo apt install libwebkit2gtk-4.1-0

# Fedora
sudo dnf install webkit2gtk4.1

# Arch Linux
sudo pacman -S webkit2gtk-4.1
```

### 설치 및 실행

```bash
# 1. 다운로드 후 실행 권한 부여
chmod +x MD\ Calendar_0.2.0_amd64.AppImage

# 2. 실행
./MD\ Calendar_0.2.0_amd64.AppImage
```

> **Tip**: `~/Applications` 폴더에 복사하면 앱 런처에서도 찾을 수 있습니다.

## Quick Start (개발자용)

```bash
# 1. Clone
git clone https://github.com/bhin-dede/md_calendar.git
cd md_calendar

# 2. Install dependencies
npm install

# 3. Run Tauri dev mode
npm run tauri:dev
```

### 프로덕션 빌드

```bash
npm run tauri:build
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Desktop Framework | Tauri 2.x (Rust) |
| Frontend | Next.js 16+ (App Router) |
| Language | TypeScript + Rust |
| Styling | CSS (Neobrutalism Design System) |
| Storage | Local File System (.md files) |
| Markdown | [marked](https://marked.js.org/) |
| Syntax Highlight | [highlight.js](https://highlightjs.org/) |
| XSS Protection | [DOMPurify](https://github.com/cure53/DOMPurify) |
| Fonts | Space Grotesk, Space Mono |

## Project Structure

```
md_calendar/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home (redirect)
│   │   ├── editor/             # Editor page
│   │   ├── list/               # Document list page
│   │   ├── calendar/           # Calendar page
│   │   └── settings/           # Settings page
│   ├── components/             # React components
│   ├── context/                # React Context
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities & Tauri API
│   └── styles/                 # CSS files
├── src-tauri/
│   ├── src/lib.rs              # Rust backend (file operations)
│   ├── Cargo.toml              # Rust dependencies
│   ├── tauri.conf.json         # Tauri configuration
│   └── capabilities/           # Tauri permissions
├── package.json
└── tsconfig.json
```

## Routes

| Route | Description |
|-------|-------------|
| `/editor` | New document editor |
| `/editor?id=xxx` | Edit existing document |
| `/list` | Document list |
| `/calendar` | Calendar view |
| `/settings` | App settings (folder selection) |

## File Storage

문서는 로컬 파일 시스템에 저장됩니다:

```
저장폴더/
├── doc_1234567890_abc12.md         # 마크다운 내용
├── doc_1234567890_abc12.meta.json  # 메타데이터
└── ...
```

### 기본 저장 위치
- Linux: `~/.local/share/com.mdcalendar.app/documents/`
- Settings에서 원하는 폴더로 변경 가능

## Data Model

```typescript
interface Document {
  id: string;        // Unique identifier
  title: string;     // Document title
  content: string;   // Markdown content
  date: number;      // Document date (timestamp)
  createdAt: number; // Created timestamp
  updatedAt: number; // Last updated timestamp
}
```

## Design System

### Neobrutalism Principles

- **Bold Borders** - 3px solid black
- **Hard Shadows** - No blur, offset only
- **Vibrant Colors** - Primary palette with high contrast
- **Playful Typography** - Space Grotesk font family

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#FF6B6B` | Buttons, accents |
| Secondary | `#4ECDC4` | Headers, highlights |
| Accent | `#FFE66D` | Backgrounds, tags |
| Purple | `#A06CD5` | Editor header |
| Background | `#FFFEF5` | Page background |

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build Next.js for production
npm run tauri:dev    # Run Tauri in development mode
npm run tauri:build  # Build Tauri desktop app
npm run lint         # Run ESLint
```

## System Requirements

### 실행만 할 경우 (AppImage)

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-0
```

### 개발/빌드할 경우

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev librsvg2-dev

# Rust 툴체인 필요
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Documentation

- [PROJECT_META.md](./PROJECT_META.md) - Project metadata & architecture
- [CONTINUATION_GUIDE.md](./CONTINUATION_GUIDE.md) - Development continuation guide

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | **Bold** |
| `Ctrl+I` | *Italic* |
| `Ctrl+K` | [Link](url) |
| `Ctrl+`` ` | `Inline code` |
| `Ctrl+1` | # Heading 1 |
| `Ctrl+2` | ## Heading 2 |
| `Ctrl+3` | ### Heading 3 |
| `Ctrl+Shift+S` | ~~Strikethrough~~ |
| `Ctrl+Shift+K` | Code block |
| `Ctrl+Shift+U` | - Bullet list |
| `Ctrl+Shift+O` | 1. Numbered list |
| `Ctrl+Shift+Q` | > Blockquote |
| `Ctrl+Shift+H` | Horizontal rule |

## Roadmap

- [x] Tauri desktop app
- [x] Local file storage
- [x] Custom folder selection
- [x] Keyboard shortcuts
- [ ] Tag system
- [ ] Dark mode
- [ ] Drag & drop import
- [ ] Cloud sync
- [ ] Version history
- [ ] Mermaid diagrams
- [ ] Math equations (KaTeX)

## License

MIT License

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Made with Tauri + Next.js + Neobrutalism
