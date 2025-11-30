# Myndigheter - React Dashboard v2.0

## Overview
Interaktiv dashboard för att visualisera och analysera svenska myndigheter.
Deployas automatiskt till GitHub Pages.

**Live site:** https://isakskogstad.github.io/myndigheter

## Tech Stack
- React 18
- Vite 6.0 (migrated from CRA)
- TailwindCSS 3.4
- Framer Motion for animations
- react-simple-maps for interactive Sweden map
- cmdk for Command Palette (⌘K)
- Recharts for data visualization
- GitHub Pages för hosting
- GitHub Actions för CI/CD

## Project Structure
```
src/
├── main.jsx              # Entry point (Vite)
├── App.jsx               # Error boundary wrapper
├── MyndigheterApp.jsx    # Main app component
├── components/
│   ├── charts/           # Recharts components, SwedenMap
│   ├── layout/           # Layout, Sidebar, Header, BottomNav
│   ├── ui/               # GlassCard, AnimatedNumber, CommandPalette, etc.
│   └── views/            # Dashboard, Analysis, Regions, etc.
├── data/                 # Constants, data fetching
├── hooks/                # Custom React hooks
└── styles/
    └── designSystem.js   # Design tokens

.github/
└── workflows/
    ├── deploy.yml              # Auto-deploy to GitHub Pages
    ├── claude.yml              # Claude Code integration (@claude)
    └── claude-code-review.yml  # Auto PR reviews
```

## Commands
```bash
npm install      # Install dependencies
npm run dev      # Run locally (localhost:5173)
npm run build    # Build for production (dist/)
npm run preview  # Preview production build
npm run deploy   # Manual deploy to GitHub Pages
```

## Key Features (v2.0)
- **Command Palette** (⌘K/Ctrl+K) - Quick navigation and search
- **Interactive Sweden Map** - Click counties to filter agencies
- **Glassmorphism UI** - Modern card components with backdrop blur
- **Dark Mode** - Full dark theme support
- **Animated Numbers** - Spring-based number transitions
- **CSV Export** - Download agency data

## Development Guidelines

### Code Style
- Functional components with hooks
- Swedish for UI text, English for code/comments
- Use design system tokens from `designSystem.js`
- Use GlassCard for card components
- CSS via TailwindCSS utility classes

### Git Workflow
- `main` branch triggers automatic deploy
- Create feature branches for new features
- PR reviews run automatically by Claude

### When Making Changes
1. Test locally with `npm run dev`
2. Run `npm run build` to verify build
3. Commit with descriptive messages
4. Push to main for auto-deploy

## Notes
- GitHub Pages deployment uses `gh-pages` branch with `dist/` folder
- Large bundles warning is expected (MyndigheterApp contains all data)
- Uses external TopoJSON for Sweden counties map
