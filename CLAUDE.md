@../CLAUDE.md
@AGENTS.md
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

This repo contains a single Next.js app under `taskflow/`. All development commands run from that directory.

## Commands

```bash
cd taskflow
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run start    # start production server
```

There are no test or lint scripts configured yet.

## Architecture

`taskflow` is a Next.js 16 App Router project using React 19, TypeScript, and Tailwind CSS v4.

- `src/app/` — App Router root. `layout.tsx` is the root layout (sets fonts, `<html>`/`<body>`). `page.tsx` is the home route.
- `src/app/globals.css` — Tailwind v4 entry (`@import "tailwindcss"`). Theme tokens are declared with `@theme inline`.
- No `src/components/`, `src/lib/`, or API routes exist yet — the project is a fresh scaffold.

## Next.js 16 — Key Differences From Prior Versions

**Read `node_modules/next/dist/docs/` before writing any code.** This version has breaking changes. Critical ones:

### Caching (`use cache` directive, not `fetch` cache options)
Enable with `cacheComponents: true` in `next.config.ts`. Use the `'use cache'` directive inside async functions/components with `cacheLife()` from `next/cache` — the old `fetch` `{ next: { revalidate } }` cache model is replaced.

### Instant client-side navigation
Suspense boundaries alone are not enough. **Export `unstable_instant` from routes that should navigate instantly.** Without it, navigations may silently block. See `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`.

### Server Functions (`'use server'`)
The term is now "Server Functions" (broader) and "Server Actions" (when used for form mutations). Always validate auth inside every Server Function — they are reachable via direct POST.

### params is now a Promise
Route segment `params` and `searchParams` are `Promise<...>` — always `await params` before destructuring.

### Server vs. Client Components
All layouts and pages are Server Components by default. Add `'use client'` only when you need state, event handlers, `useEffect`, or browser APIs.

# TaskFlow — Kanban Project Management Board

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind
- Prisma + Neon Postgres (pooled connection)
- Auth.js v5 (Credentials provider, JWT session)
- dnd-kit/core + dnd-kit/sortable for drag-drop
- fractional-indexing for card/column ordering
- Deployed to Vercel

## Architecture decisions
- Server Components by default; "use client" only for DnD and forms
- Server Actions for all mutations (no separate API routes)
- Position field is a fractional index string, NOT a number — Figma-style ordering
- Card moves trigger 1 DB write (only the moved card's position), never recalculate the whole column
- Optimistic UI on drag-drop: update local state immediately, reconcile on server response

## Conventions
- Components in PascalCase: src/components/Board/Column.tsx
- Server Actions in src/lib/actions/*.ts
- Prisma client imported from src/lib/prisma.ts (singleton)
- Form validation with Zod schemas in src/lib/schemas.ts

## What NOT to do
- No real-time collaboration (out of scope for 48h sprint)
- No board sharing / invitations
- No activity history
- No card labels or assignees (only due date)
- No localStorage / sessionStorage in code

## Mobile
- Touch sensor with activationConstraint (200ms delay, 5px tolerance) so scroll still works
- Test at 375px width minimum