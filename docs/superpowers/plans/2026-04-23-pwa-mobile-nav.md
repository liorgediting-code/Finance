# PWA + Mobile Bottom Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PWA "Add to Home Screen" support and replace the mobile hamburger menu with a bottom navigation bar while preserving the existing design language.

**Architecture:** `vite-plugin-pwa` generates the service worker and manifest automatically from `vite.config.ts`. A new `BottomNav.tsx` component renders only on mobile (`md:hidden`) using the same NavLink + lavender color tokens as the existing sidebar. The desktop sidebar is untouched.

**Tech Stack:** `vite-plugin-pwa` (Workbox), `@vite-pwa/assets-generator` (icon generation), React NavLink, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-04-23-pwa-mobile-nav-design.md`

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install vite-plugin-pwa and assets generator**

```bash
npm install -D vite-plugin-pwa @vite-pwa/assets-generator
```

Expected output: added packages, no errors.

- [ ] **Step 2: Verify install**

```bash
npx vite --version
```

Expected: version string printed without error.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vite-plugin-pwa and assets-generator"
```

---

### Task 2: Create SVG source icon and generate PNG icons

**Files:**
- Create: `public/icons/icon.svg`
- Create: `public/icons/icon-192.png` (generated)
- Create: `public/icons/icon-512.png` (generated)
- Create: `pwa-assets.config.ts`

- [ ] **Step 1: Create `public/icons/` directory and SVG source icon**

Create `public/icons/icon.svg` with this content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#5B52A0"/>
  <line x1="320" y1="360" x2="320" y2="180" stroke="white" stroke-width="56" stroke-linecap="round"/>
  <line x1="256" y1="360" x2="256" y2="80" stroke="white" stroke-width="56" stroke-linecap="round"/>
  <line x1="192" y1="360" x2="192" y2="260" stroke="white" stroke-width="56" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: Create `pwa-assets.config.ts` in the project root**

```typescript
import { defineConfig } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: 'minimal',
  images: ['public/icons/icon.svg'],
});
```

- [ ] **Step 3: Generate icons**

```bash
npx pwa-assets-generator --config pwa-assets.config.ts
```

Expected: creates `public/icons/pwa-192x192.png`, `public/icons/pwa-512x512.png`, and possibly `public/icons/apple-touch-icon-180x180.png`.

Check what files were actually created:

```bash
ls public/icons/
```

Note the exact filenames — you will use them in Task 3.

- [ ] **Step 4: Commit**

```bash
git add public/icons/ pwa-assets.config.ts
git commit -m "chore: add PWA app icons"
```

---

### Task 3: Configure vite-plugin-pwa

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Replace `vite.config.ts` with PWA-enabled config**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'ניהול פיננסי משפחתי',
        short_name: 'פיננסי',
        description: 'מעקב פיננסי משפחתי',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#5B52A0',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
```

> **Note:** If the generated icon filenames from Task 2 differ from `pwa-192x192.png` / `pwa-512x512.png`, update the `src` values in the `icons` array to match the actual filenames from `ls public/icons/`.

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: no TypeScript or bundle errors. The `dist/` folder should contain `manifest.webmanifest` and `sw.js`.

```bash
ls dist/
```

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: configure vite-plugin-pwa with manifest and service worker"
```

---

### Task 4: Add PWA meta tags to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update `index.html` `<head>` with PWA meta tags**

Replace the current `<head>` block with:

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#5B52A0" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="פיננסי" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <title>ניהול פיננסי משפחתי</title>
  </head>
```

> **Note:** If `apple-touch-icon-180x180.png` was not generated in Task 2, use `icons/pwa-192x192.png` as the `apple-touch-icon` href instead.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add PWA meta tags for iOS and Android"
```

---

### Task 5: Create BottomNav component

**Files:**
- Create: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Create `src/components/layout/BottomNav.tsx`**

```typescript
import { NavLink } from 'react-router-dom';

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const NAV = [
  { to: '/', label: 'לוח חודשי', icon: <CalendarIcon />, end: true },
  { to: '/settings', label: 'הגדרות', icon: <GearIcon />, end: false },
];

export default function BottomNav() {
  const base = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors duration-150';
  const activeClass = 'text-[#5B52A0] font-semibold';
  const inactiveClass = 'text-[#9090A8]';

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white border-t border-gray-100 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `${base} ${isActive ? activeClass : inactiveClass}`}
        >
          {({ isActive }) => (
            <>
              <span className={`flex items-center justify-center w-8 h-8 rounded-xl transition-colors duration-150 ${isActive ? 'bg-lavender' : ''}`}>
                {icon}
              </span>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/BottomNav.tsx
git commit -m "feat: add BottomNav component for mobile navigation"
```

---

### Task 6: Wire BottomNav into AppShell, fix bottom padding, remove unused toggle

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Update `AppShell.tsx`**

Replace the entire file with:

```typescript
import { useCallback, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
```

> `toggleSidebar` is removed — the hamburger is gone and the desktop sidebar is always static. `sidebarOpen` state remains so Sidebar's `onClose` prop still works (it resets state after any programmatic open). `pb-20` on mobile gives clearance for the 56px bottom bar plus safe-area inset. `md:pb-6` restores the original desktop padding.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat: integrate BottomNav into AppShell with safe bottom padding"
```

---

### Task 7: Remove hamburger button from Header

**Files:**
- Modify: `src/components/layout/Header.tsx`

The hamburger served mobile navigation. Bottom nav replaces it on mobile, and the desktop sidebar is always statically visible — so the button and its prop are no longer needed anywhere.

- [ ] **Step 1: Replace `Header.tsx` with the prop-free version**

```typescript
import { useLocation } from 'react-router-dom';

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'לוח חודשי';
  if (pathname === '/savings') return 'חסכונות';
  if (pathname === '/settings') return 'הגדרות';
  return 'ניהול פיננסי';
}

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-4 py-3 md:px-6 shadow-sm">
      <h2 className="text-base font-semibold text-[#1E1E2E] tracking-tight md:hidden">
        {getPageTitle(pathname)}
      </h2>
    </header>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors (no unused `onMenuToggle` param).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: remove hamburger from Header, bottom nav handles mobile navigation"
```

---

### Task 8: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add `.superpowers/` to `.gitignore`**

Append to `.gitignore`:

```
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm artifacts"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```

Expected: clean build. Check `dist/` for `manifest.webmanifest` and `sw.js`:

```bash
ls dist/ | grep -E "manifest|sw"
```

- [ ] **Step 2: Preview production build and manually test on mobile**

```bash
npm run preview
```

Open `http://localhost:4173` in a mobile browser (or Chrome DevTools mobile emulation). Verify:
- Bottom navigation bar appears at the bottom
- Tapping "לוח חודשי" navigates to `/` and highlights the icon in lavender
- Tapping "הגדרות" navigates to `/settings` and highlights correctly
- Content is not hidden behind the bottom bar
- No hamburger button visible on mobile
- On desktop: sidebar visible, no bottom bar visible

- [ ] **Step 3: Check PWA install prompt**

In Chrome DevTools → Application → Manifest — verify the manifest loads correctly with the app name, icons, and theme color.

In Chrome DevTools → Application → Service Workers — verify the service worker is registered.

- [ ] **Step 4: Commit any final fixes if needed**

```bash
git add -A
git commit -m "fix: final PWA and mobile nav adjustments"
```
