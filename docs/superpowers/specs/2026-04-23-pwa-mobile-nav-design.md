# PWA + Mobile Navigation Design

**Date:** 2026-04-23  
**Scope:** Add PWA "Add to Home Screen" support and replace mobile hamburger menu with a bottom navigation bar.

---

## Goals

1. Allow mobile users to install the app from the browser ("Add to Home Screen").
2. Improve mobile navigation ergonomics by replacing the hamburger+sidebar pattern with a bottom navigation bar.
3. Preserve the existing visual design language exactly (colors, typography, component style).

---

## Part 1: PWA Support

### Package

Add `vite-plugin-pwa` as a dev dependency. It integrates with Vite to auto-generate a `manifest.json` and a Service Worker via Workbox.

### Manifest Configuration

| Field | Value |
|---|---|
| `name` | `ניהול פיננסי משפחתי` |
| `short_name` | `פיננסי` |
| `lang` | `he` |
| `dir` | `rtl` |
| `display` | `standalone` |
| `orientation` | `portrait` |
| `theme_color` | `#5B52A0` |
| `background_color` | `#ffffff` |
| `start_url` | `/` |
| `scope` | `/` |

### App Icons

Two PNG icons generated from a simple SVG (bar-chart symbol on `#5B52A0` background):
- `public/icons/icon-192.png` — 192×192
- `public/icons/icon-512.png` — 512×512

Both icons declared in the manifest's `icons` array with `purpose: "any maskable"`.

### Service Worker Strategy

Use Workbox via `vite-plugin-pwa` with:
- **Static assets** (JS, CSS, fonts): `CacheFirst` — served from cache, updated in background.
- **Navigation requests** (HTML): `NetworkFirst` — always try network, fall back to cache.
- Supabase API calls are not cached (network only).

### iOS Support

Add to `index.html`:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="פיננסי" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<meta name="theme-color" content="#5B52A0" />
```

---

## Part 2: Mobile Bottom Navigation Bar

### Behavior

- **Mobile only** (`md:hidden`): A fixed bottom bar replaces the hamburger button.
- **Desktop**: Sidebar remains completely unchanged.
- The hamburger button in `Header.tsx` is hidden on mobile (`hidden md:hidden` → only shown on desktop if needed, or removed entirely since sidebar serves desktop).

### Navigation Items

| Icon | Label | Route | `end` |
|---|---|---|---|
| Calendar | לוח חודשי | `/` | `true` |
| Gear | הגדרות | `/settings` | `false` |

Admin users do not get an extra bottom nav item — the admin link remains accessible only via desktop sidebar.

### New Component: `BottomNav.tsx`

Location: `src/components/layout/BottomNav.tsx`

- Uses `NavLink` from react-router-dom, same as `Sidebar.tsx`.
- **Active state**: `bg-lavender text-[#5B52A0]` pill behind icon (same lavender token as sidebar).
- **Inactive state**: `text-[#9090A8]`.
- Height: `56px` + `pb-safe` (env `safe-area-inset-bottom`) for iPhone notch support.
- Background: `bg-white`, `border-t border-gray-100`, `shadow-[0_-1px_4px_rgba(0,0,0,0.06)]`.

### Changes to Existing Components

**`AppShell.tsx`**
- Import and render `<BottomNav />` inside the main content wrapper.
- Add `pb-14 md:pb-0` to `<main>` so content isn't hidden under the bottom bar.

**`Header.tsx`**
- Hide the hamburger toggle button on mobile (`md:hidden` → only show on desktop where sidebar is still used).

**`Sidebar.tsx`**
- No changes — desktop behavior is unchanged.

---

## Files Changed / Created

| File | Action |
|---|---|
| `package.json` | Add `vite-plugin-pwa` dev dependency |
| `vite.config.ts` | Register `VitePWA` plugin with manifest + Workbox config |
| `index.html` | Add PWA meta tags (theme-color, apple-mobile-web-app-*) |
| `public/icons/icon-192.png` | New — app icon 192×192 |
| `public/icons/icon-512.png` | New — app icon 512×512 |
| `src/components/layout/BottomNav.tsx` | New — mobile bottom navigation bar |
| `src/components/layout/AppShell.tsx` | Add `<BottomNav />`, add `pb-14 md:pb-0` to `<main>` |
| `src/components/layout/Header.tsx` | Hide hamburger on mobile |

---

## Out of Scope

- Dark mode.
- Push notifications.
- Background sync.
- Savings page link in bottom nav (user decision: only לוח חודשי + הגדרות).
