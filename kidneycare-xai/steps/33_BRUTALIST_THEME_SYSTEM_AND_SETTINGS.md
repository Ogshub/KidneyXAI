# Step 33 — Brutalist "House" Theme System & Settings Integration

## Date: 2026-09-07
## Status: ✅ COMPLETE

---

## Overview

Implemented a dual design-language system that allows users to switch between the existing **Clinical** theme (teal/slate, rounded, medical-grade) and a new **House Brutalist** theme inspired by bold typographic-heavy design (sharp corners, thick borders, red/yellow/black palette, uppercase text).

The theme style is **orthogonal** to the light/dark color mode — users can combine any design language with any color mode (e.g., Brutalist + Dark, Clinical + Light, etc.).

---

## Design Tokens — Brutalist "House" Theme

| Token | Light Value | Dark Value |
|---|---|---|
| `--primary` | `#e63326` (bold red) | `#e63326` |
| `--bg-page` | `#f5f0e8` (warm cream) | `#1a1a1a` (near-black) |
| `--bg-surface` | `#f5f0e8` | `#242424` |
| `--border-subtle` | `#1a1a1a` | `#f5f0e8` |
| `--text-main` | `#1a1a1a` | `#f5f0e8` |
| `--brutalist-yellow` | `#f5c518` | `#f5c518` |
| `--brutalist-red` | `#e63326` | `#e63326` |
| `--brutalist-border` | `3px` | `3px` |

---

## Files Modified

### Context Layer
- **`frontend/src/context/ThemeContext.jsx`**
  - Added `themeStyle` state (`'clinical'` | `'brutalist'`)
  - Added `isBrutalist` computed flag
  - Persists to `localStorage` key `kidneycare_theme_style`
  - Applies `.brutalist` class to `<html>` element
  - Exposed: `themeStyle`, `setThemeStyle`, `isBrutalist`

### CSS Design System
- **`frontend/src/index.css`**
  - Added `.brutalist` and `.brutalist.dark` CSS custom property blocks
  - Global overrides: `border-radius: 0` for all elements
  - Uppercase headings with `letter-spacing: 0.04em` and `font-weight: 900`
  - Thick 3px borders on brutalist containers
  - Yellow selection highlights
  - Sharp focus outlines with red color
  - Custom scrollbar styling for brutalist mode

### Common Components (all brutalist-aware)
- **`frontend/src/components/common/Card.jsx`** — Sharp corners, thick 3px borders, yellow icon boxes, uppercase titles
- **`frontend/src/components/common/Button.jsx`** — Blocky buttons, uppercase text, arrow glyph (↗), red/yellow/black palette
- **`frontend/src/components/common/Input.jsx`** — Thick borders, no radius, uppercase labels, red focus color
- **`frontend/src/components/common/Feedback.jsx`** — Badge (sharp, uppercase), Alert (thick border, colored backgrounds), Spinner (yellow/red)

### Layout Components
- **`frontend/src/components/layout/Layout.jsx`** — Reads `isBrutalist`, applies brutalist-aware background colors
- **`frontend/src/components/layout/Navbar.jsx`** — Full dual rendering path (brutalist: thick bottom border, blocky logo, yellow highlights, uppercase nav links, red accents)
- **`frontend/src/components/layout/Footer.jsx`** — Full dual rendering path (brutalist: black bg, cream text, red disclaimer, yellow section headers)

### Pages
- **`frontend/src/pages/Settings.jsx`**
  - New **"Design Language"** card in Appearance tab with visual previews
  - Two clickable cards: "Clinical" and "House" with mini UI previews
  - Separated from Color Mode (Light/Dark/System) which is in its own card below
  - All settings UI elements are brutalist-aware
  - Clear cache now also resets `kidneycare_theme_style`

---

## Verification

```bash
cd frontend && npm run build
# ✅ Build succeeded with exit code 0
```

- Toggle between Clinical ↔ House in Settings > Theme & Display tab
- Both themes work with Light, Dark, and System color modes
- All common components transform correctly
- Navbar, Footer, and Settings page fully adapt

---

## Architecture Decision

The brutalist theme is implemented as a **CSS-first approach** where:
1. Global CSS custom properties override colors when `.brutalist` is on `<html>`
2. Global CSS rules handle zero border-radius and uppercase headings
3. Components use `isBrutalist` from `useTheme()` for structural class switching
4. This means pages that weren't explicitly touched still benefit from the theme cascade

---

## Next Step Dependency
→ Step 34: User Profile Picture & Supabase Schema Update
→ Step 35: Brutalist Theme Full Application Integration
