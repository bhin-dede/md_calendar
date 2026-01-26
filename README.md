# MD Calendar

> 웹 기반 마크다운 에디터 & 캘린더 애플리케이션

![Neobrutalism Design](https://img.shields.io/badge/Design-Neobrutalism-FF6B6B)
![Vanilla JS](https://img.shields.io/badge/JS-Vanilla%20ES6+-F7DF1E)
![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB-4ECDC4)

## Features

- **Split Editor** - 좌측 마크다운 에디터, 우측 실시간 프리뷰
- **Auto Save** - 2초 디바운스 자동 저장
- **Import/Export** - .md 파일 가져오기/내보내기
- **Document List** - 문서 목록 관리 및 검색
- **Calendar View** - 날짜별 문서 시각화
- **Neobrutalism UI** - 모던하고 독특한 디자인

## Screenshots

| Editor | Calendar |
|--------|----------|
| 마크다운 편집 & 실시간 프리뷰 | 날짜별 문서 표시 |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/md_calendar.git
cd md_calendar

# 2. Run (Python 3)
python3 -m http.server 8080

# 3. Open browser
open http://localhost:8080
```

### Alternative: Node.js

```bash
npx http-server -p 8080
```

### Alternative: VS Code

1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Vanilla JavaScript (ES6 Modules) |
| Storage | IndexedDB |
| Markdown | [marked.js](https://marked.js.org/) |
| Syntax Highlight | [highlight.js](https://highlightjs.org/) |
| XSS Protection | [DOMPurify](https://github.com/cure53/DOMPurify) |
| Design | Neobrutalism |
| Fonts | Space Grotesk, Space Mono |

## Project Structure

```
md_calendar/
├── index.html              # SPA entry point
├── css/
│   ├── design-system.css   # Design tokens & utilities
│   ├── components.css      # UI component styles
│   └── layout.css          # Layout & responsive
└── js/
    ├── app.js              # App initialization
    ├── db.js               # IndexedDB service
    ├── router.js           # Hash-based router
    └── components/
        ├── editor.js       # Markdown editor
        ├── document-list.js # Document list
        └── calendar.js     # Calendar view
```

## Routes

| Route | Description |
|-------|-------------|
| `#/editor` | New document editor |
| `#/editor/:id` | Edit existing document |
| `#/list` | Document list |
| `#/calendar` | Calendar view |

## Data Model

```javascript
{
  id: string,        // Unique identifier
  title: string,     // Document title
  content: string,   // Markdown content
  date: number,      // Document date (timestamp)
  createdAt: number, // Created timestamp
  updatedAt: number  // Last updated timestamp
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

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Development

### Prerequisites

- Modern web browser
- Local HTTP server (Python 3, Node.js, or VS Code Live Server)

### Local Development

```bash
# Start development server
python3 -m http.server 8080

# Open in browser
http://localhost:8080
```

### Adding New Features

1. Create component in `js/components/`
2. Register route in `js/app.js`
3. Add styles in `css/components.css`

See [CONTINUATION_GUIDE.md](./CONTINUATION_GUIDE.md) for detailed development guide.

## Roadmap

- [ ] Tag system
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Drag & drop import
- [ ] PWA support
- [ ] Cloud sync
- [ ] Version history
- [ ] Mermaid diagrams
- [ ] Math equations (KaTeX)

## Documentation

- [PROJECT_META.md](./PROJECT_META.md) - Project metadata & architecture
- [CONTINUATION_GUIDE.md](./CONTINUATION_GUIDE.md) - Development continuation guide

## License

MIT License

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Made with Neobrutalism
