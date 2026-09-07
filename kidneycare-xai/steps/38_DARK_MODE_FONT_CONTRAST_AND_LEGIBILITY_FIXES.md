# Step 38 — Dark Mode Font Contrast & Legibility Fixes

## Date: 2026-09-07
## Status: ✅ COMPLETE

---

## Overview

Identified and fixed an issue where headings, metric numbers, and body text rendered as dark navy/black on dark backgrounds (`#1a1a1a` / `#141414`) when dark mode was active in both Brutalist and Clinical themes.

---

## Root Cause Analysis

1. **Hardcoded Slate Utility Classes**: Certain pages (especially `ResearchAnalytics.jsx`) contained hardcoded Tailwind utility classes (`text-slate-900`, `text-slate-800`, `text-slate-600`, `text-emerald-700`). Because utility classes set exact hex colors (`#0f172a`), they overrode the body's CSS custom property (`--text-main: #f5f0e8`) on dark backgrounds, causing black text on dark surfaces.
2. **Missing Theme Cascade Rules in CSS**: The brutalist dark mode rule set had defined `--text-main` and `--text-muted`, but lacked explicit CSS selectors to elevate hardcoded Tailwind classes in `.dark` and `.brutalist.dark` scopes.

---

## Changes Implemented

### 1. Global Dark Mode Text Contrast Enforcement (`frontend/src/index.css`)
- Added universal `.dark` rules that automatically elevate `text-slate-900`, `text-slate-800`, `text-gray-900` to `var(--text-main)` (`#f5f0e8` in Brutalist, `#f8fafc` in Clinical).
- Elevated `text-slate-700`, `text-slate-600`, `text-slate-500` to `var(--text-muted)` (`#d6cebe` in Brutalist, `#94a3b8` in Clinical).
- Ensured all `<h1>` through `<h6>` tags always inherit `var(--text-main)`.
- Increased contrast of `--text-muted` in brutalist dark mode from `#b8b0a0` to `#d6cebe`.
- Deepened `--bg-page` to `#141414` and `--bg-surface` to `#1f1f1f` for maximum visual pop.

```css
/* Hardcoded dark text classes automatically promoted in Dark Mode */
.dark .text-slate-900,
.dark .text-slate-800,
.dark .text-gray-900,
.dark .text-gray-800 {
  color: var(--text-main) !important;
}

.dark .text-slate-700,
.dark .text-slate-600,
.dark .text-gray-700,
.dark .text-gray-600 {
  color: var(--text-muted) !important;
}

/* Brutalist Dark Mode Specific Overrides */
.brutalist.dark h1,
.brutalist.dark h2,
.brutalist.dark h3,
.brutalist.dark h4,
.brutalist.dark h5,
.brutalist.dark h6 {
  color: var(--brutalist-cream) !important;
}

.brutalist.dark .text-slate-900,
.brutalist.dark .text-slate-800,
.brutalist.dark .text-slate-700 {
  color: var(--brutalist-cream) !important;
}

.brutalist.dark .text-slate-600,
.brutalist.dark .text-slate-500,
.brutalist.dark .text-slate-400,
.brutalist.dark p {
  color: var(--text-muted) !important;
}
```

### 2. Comprehensive Typography Update (`frontend/src/pages/ResearchAnalytics.jsx`)
- Main Title: Switched from `text-slate-900` to `text-[var(--text-main)] dark:text-slate-100`.
- Subtitle: Switched to `text-[var(--text-muted)] dark:text-slate-300`.
- Metric numbers (`0.992`, `4.5`, `5.0`, `2`): Elevated to `text-[var(--text-main)] dark:text-white`.
- Hypothesis testing boxes (H1, H2, H3): Updated to `p-4 border-[2px] border-[var(--border-subtle)] bg-[var(--bg-surface)]` in Brutalist mode, with high-contrast text and strong tags in `var(--text-main)`.
- Hydration & Literacy distribution charts: Standardized labels and contrast on progress tracks.

---

## Verification & Deployment

- **Build Check**: `npm run build` completed with zero errors.
- **Visual Contrast**: Dark mode text across headings, numbers, descriptions, and cards is razor-sharp and easily readable.
- **Git Push**: Pushed to `origin main` to trigger live deployment on Vercel.
