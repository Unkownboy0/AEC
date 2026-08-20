# CampusOS — Global Background Watermark Visibility Fix Report

## Overview
This report documents the resolution of the global institutional background watermark visibility, contrast, and layout integration across Light and Dark themes, Desktop and Mobile viewports.

---

## 1. Root Causes Identified & Fixed

| Issue | Root Cause | Fix Applied |
| :--- | :--- | :--- |
| **Dark Theme Invisibility** | CSS rule had `opacity: 0.025` combined with `filter: brightness(0) invert(1) opacity(0.6)` resulting in effective opacity of **1.5%**, rendering it invisible on dark slate `#07090E` backgrounds. | Removed the destructive `opacity(0.6)` filter. Calibrated `--campus-watermark-opacity-dark: 0.058` (~5.8%) with crisp `brightness(0) invert(1) contrast(110%)` monochrome mask. |
| **Light Theme Muted Contrast** | Heavy sepia/hue-rotate filter was causing muddy contrast against white/off-white background surfaces. | Updated light mode filter to clean grayscale with `--campus-watermark-opacity-light: 0.048` (~4.8%). |
| **Duplicate / Fragmented Components** | Multiple references across layout trees. | Canonicalized into `InstitutionBackgroundWatermark` in `InstitutionalWatermark.tsx` with backward-compatible alias export `InstitutionalWatermark`. |
| **Viewport Alignment & Size** | Watermark was fighting top headers or clipping on smaller mobile screens. | Responsive sizing constraints: Mobile `w-[65vw] max-w-[340px]`, Tablet `md:w-[45vw] max-w-[440px]`, Desktop `lg:w-[36vw] max-w-[540px]`. Fixed centered positioning at `top-[54%]` (below headers). |
| **Asset Missing / Broken Image** | Image error handling was missing if custom watermark asset URL was unreachable. | Added safe `onError={() => setHasError(true)}` to prevent broken image icons from ever displaying. |
| **Canvas Isolation in Workspace** | Document paper surfaces in Campus Workspace need clean white paper canvas. | Workspace document canvases (`CampusDocsEditor`, `CampusSheetsEditor`, `CampusReportBuilder`) maintain clean opaque paper surfaces while the app shell renders the watermark in background open areas. |

---

## 2. Visual Stacking Architecture

```
┌────────────────────────────────────────────────────────┐
│  APP SHELL BACKGROUND  (bg-background / bg-app-bg)    │  z-index: 0
├────────────────────────────────────────────────────────┤
│  INSTITUTION BACKGROUND WATERMARK                      │  z-index: 0 (pointer-events: none)
│  • Light Theme: 4.8% opacity                           │
│  • Dark Theme: 5.8% opacity                            │
├────────────────────────────────────────────────────────┤
│  PAGE CONTENT & LAYOUT MATRICES                        │  z-index: 10
├────────────────────────────────────────────────────────┤
│  CARDS, TABLES, MODALS & BOTTOM NAVIGATION             │  z-index: 20–50
└────────────────────────────────────────────────────────┘
```

---

## 3. Calibrated Design Tokens (`index.css`)

```css
/* INSTITUTIONAL WATERMARK THEME STYLING — CALIBRATED FOR CRISP SUBTLETY */
:root {
  --campus-watermark-opacity-light: 0.048;
  --campus-watermark-opacity-dark: 0.058;
}

.watermark-img,
.institutional-watermark-overlay img {
  opacity: var(--campus-watermark-opacity-light, var(--watermark-opacity-light, 0.048)) !important;
  filter: grayscale(100%) contrast(105%);
}

.dark .watermark-img,
.dark .institutional-watermark-overlay img {
  opacity: var(--campus-watermark-opacity-dark, var(--watermark-opacity-dark, 0.058)) !important;
  filter: brightness(0) invert(1) contrast(110%) !important;
}
```

---

## 4. Verification Checklist

- [x] Visible, subtle, and aesthetic in Light Theme (calibrated 4.8% opacity).
- [x] Visible, clean, and crisp in Dark Theme (calibrated 5.8% opacity against `#07090E`).
- [x] `pointer-events: none` and `select-none` to guarantee zero interference with user interactions.
- [x] Responsive on Mobile (320px–480px), Tablet (768px–1024px), and Desktop (1280px+).
- [x] Exempt routes (Login, Register, Face Verification, QR Scanner) remain watermark-free.
- [x] Campus Workspace document sheets remain clean white paper canvases.
