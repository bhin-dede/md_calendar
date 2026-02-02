# MD Calendar

> 웹 기반 마크다운 에디터 & 캘린더 애플리케이션

![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Design](https://img.shields.io/badge/Design-Neobrutalism-FF6B6B)
![Storage](https://img.shields.io/badge/Storage-IndexedDB-4ECDC4)

## Features

- **Split Editor** - 좌측 마크다운 에디터, 우측 실시간 프리뷰
- **Auto Save** - 2초 디바운스 자동 저장
- **Import/Export** - .md 파일 가져오기/내보내기
- **Document List** - 문서 목록 관리 및 검색
- **Calendar View** - 날짜별 문서 시각화
- **Neobrutalism UI** - 모던하고 독특한 디자인

## Quick Start

```bash
# 1. Clone
git clone https://github.com/bhin-dede/md_calendar.git
cd md_calendar

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | CSS (Neobrutalism Design System) |
| Storage | IndexedDB |
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
│   │   ├── editor/             # Editor pages
│   │   ├── list/               # Document list page
│   │   └── calendar/           # Calendar page
│   ├── components/             # React components
│   │   ├── Header.tsx
│   │   ├── Modal.tsx
│   │   ├── editor/
│   │   ├── document-list/
│   │   └── calendar/
│   ├── context/                # React Context
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities & DB
│   └── styles/                 # CSS files
├── public/                     # Static assets
├── package.json
└── tsconfig.json
```

## Routes

| Route | Description |
|-------|-------------|
| `/editor` | New document editor |
| `/editor/[id]` | Edit existing document |
| `/list` | Document list |
| `/calendar` | Calendar view |

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
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Documentation

- [PROJECT_META.md](./PROJECT_META.md) - Project metadata & architecture
- [CONTINUATION_GUIDE.md](./CONTINUATION_GUIDE.md) - Development continuation guide

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

## License

MIT License

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Made with Next.js + Neobrutalism
