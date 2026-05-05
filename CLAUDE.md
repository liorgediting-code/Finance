# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hebrew RTL personal/family finance tracker for Israeli households. Vite + React 19 SPA with Tailwind CSS v4, deployed on Vercel. All UI text is in Hebrew with right-to-left layout.

## Commands

- **Dev server:** `npm run dev`
- **Build (type-check + bundle):** `npm run build` (runs `tsc -b && vite build`)
- **Preview production build:** `npm run preview`
- No test framework is configured.

## Architecture

### Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (via `@tailwindcss/vite`)
- **State:** Zustand store (`src/store/useFinanceStore.ts`) — single store holds all financial data
- **Auth:** Supabase Auth with admin-approval workflow (`src/store/useAuthStore.ts`)
- **Backend:** Supabase (auth + Postgres for data persistence). One Vercel serverless function at `api/admin/create-user.ts`
- **Charts:** Recharts
- **Routing:** React Router v7 with `BrowserRouter`

### Data Flow

All financial data lives in a single Zustand store (`CloudData` interface). On login, data loads from Supabase `user_data` table. Changes are auto-saved via debounced upsert (1s delay). The store syncs the entire state blob as JSON — there are no per-record DB tables for expenses/income.

### Auth Flow

1. Users sign up → profile created with `is_approved: false`
2. Admin approves via `/admin` panel
3. `AuthGuard` component gates all app routes — unapproved users see a pending screen
4. Supabase env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Key Data Model

- **Family members** — dynamic list (replaces old fixed-spouse model), each with `id` and `name`
- **Income/Expenses** — per-month entries stored in `months[monthIndex]`, plus separate `recurringIncomes` and `recurringExpenses` arrays that auto-apply to monthly totals
- **Savings funds** — independent tracking with target/saved amounts
- **Categories** — 16 Israeli-specific expense categories defined in `src/config/categories.ts` with Hebrew names, each with subcategories. The "other" category supports `customCategory` free-text naming
- **Subscriptions** — expenses in the `subscriptions` category auto-enable `isRecurring` and support a `cancelUrl` field

### Route Structure

- `/login`, `/signup` — public auth pages
- `/` — main dashboard (month view with expenses, income, charts)
- `/savings` — savings fund management
- `/settings` — app settings and family member management
- `/admin` — admin user approval panel

## Conventions

- All Hebrew text strings are inline in components (no i18n library)
- Month indices are 0-based (January = 0)
- IDs generated with `uuid` v4
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters` are enabled — build will fail on unused variables

## Git Workflow

- **Always push to `main`.** When finishing any task that requires a push to GitHub, merge the current branch into `main` and push `main` to `origin/main`.
- If currently on a feature branch, run: `git checkout main && git merge <feature-branch> --ff-only && git push -u origin main`
- Never finish by pushing only to a feature branch.
