# TaskFlow — Handoff Document

This is a context-transfer summary from a planning conversation in another 
Claude session. We're 1/3 of the way through a 48-hour interview project. 
This document captures decisions, architecture, what's done, what's next, 
and the constraints/pitfalls already encountered.

## Project context

48-hour sprint for an interview at a Turkish company (Koçsistem). 
Brief asks for a Trello-like Kanban board:
- Users can sign up + log in
- Create boards, columns, cards
- Drag-drop cards across columns (and within columns)
- Order persists across page reloads
- Edit card title/description (and a due date — chosen extension)
- Mobile-friendly (touch DnD must work without breaking scroll)
- Deployed to Vercel
- Grading focuses on engineering: DnD smoothness, ordering correctness, 
  data model consistency, library choice rationale, mobile usability

Visual polish is NOT a grading criterion (per the brief). Engineering 
correctness and the rationale for technical decisions are.

## Stack (locked in)

- **Next.js 16.2.4** App Router + TypeScript + Tailwind + Turbopack
- **Postgres on Neon** (Frankfurt region, pooled + direct URLs)
- **Prisma 6.19.3** with custom output `src/generated/prisma`
- **Auth.js v5 (beta)** Credentials provider + JWT session strategy
- **bcryptjs** for password hashing (NOT bcrypt — pure JS, no native binary)
- **Zod** for validation
- **dnd-kit** for drag-drop (NOT installed yet — this is the next phase)
- **fractional-indexing** for card/column ordering (NOT installed yet)
- Deploy target: Vercel

## Key architectural decisions (with rationale, since interviewer will ask)

### Why Next.js + Server Actions
Brief mandates Vercel; Next is the natural fit. Server Actions remove 
the need for a separate API layer for mutations. Server Components by 
default; "use client" only where interactivity demands it (forms, DnD).

### Why Prisma over Drizzle/raw SQL
Type safety + migration management + Prisma Studio for debug. Prisma 
queries compile to SQL; runtime overhead is minimal. Trade-off chosen 
in favor of maintainability for a 48-hour sprint.

### Why JWT session strategy (not database sessions)
Credentials provider + stateless JWT means no Account/Session tables, 
no Auth.js Prisma adapter needed. Simpler. We manually look up the user 
in `authorize()` via Prisma + bcrypt.compare.

### Why fractional indexing for card ordering
- Cards have `position: String` (NOT a number)
- Inserting between two cards generates a new string between their 
  positions (Figma's approach)
- ONE database write per drag, never recalculate the whole column
- Float would have precision problems after ~52 mid-insertions
- Library: `fractional-indexing` (npm)

### Why dnd-kit over alternatives
- HTML5 native: doesn't work on mobile, eliminated
- SortableJS: imperative, fights React, no a11y, eliminated
- @hello-pangea/dnd: fork of deprecated react-beautiful-dnd, 
  larger bundle, weaker mobile, eliminated
- dnd-kit: actively maintained, React-first hooks API, modular bundle 
  (~21 KB), built-in keyboard sensor + screen reader announcer, 
  separate PointerSensor + TouchSensor with activationConstraint 
  (delay/distance) for mobile long-press without breaking scroll

### Why Auth.js v5 split config (auth.config.ts vs src/lib/auth.ts)
Middleware runs in Edge runtime — Prisma doesn't work there (Node-only). 
Split config is Auth.js v5's official pattern:
- `auth.config.ts` (root) → Edge-safe — no Prisma, no bcrypt imports
- `src/lib/auth.ts` → Full Node config — Prisma adapter and Credentials 
  authorize() with bcrypt live here
- `middleware.ts` only imports `authConfig`, never `auth.ts`

### Why `passwordHash` field name (not `password`)
Field name should reflect that the value is a bcrypt hash, not plaintext. 
Reduces accidental leakage risk in logs/responses. Senior code reviewers 
flag `password` as ambiguous.

## Database schema

Defined in `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  boards       Board[]
}

model Board {
  id        String   @id @default(cuid())
  title     String
  position  String   // fractional index
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  columns   Column[]
  @@index([userId])
}

model Column {
  id        String   @id @default(cuid())
  title     String
  position  String
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  cards     Card[]
  @@index([boardId])
}

model Card {
  id          String    @id @default(cuid())
  title       String
  description String?
  position    String
  dueDate     DateTime?
  columnId    String
  column      Column    @relation(fields: [columnId], references: [id], onDelete: Cascade)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([columnId])
}
```

Schema notes:
- cuid() IDs (URL-safe, Postgres index locality better than UUIDv4)
- All FKs indexed
- Cascade deletes prevent orphan rows
- Position fields are strings, will hold fractional-indexing values

## What's done (verified working)

### Setup
- [x] Next.js 16 + TS + Tailwind + Turbopack project scaffolded
- [x] Neon Postgres in Frankfurt region (pooled + direct URLs in `.env`)
- [x] Prisma 6 schema applied via `migrate dev --name init`
- [x] All four tables exist in DB (verified via Prisma Studio)

### Auth (fully tested end-to-end)
- [x] Auth.js v5 split config (`auth.config.ts` Edge-safe, `src/lib/auth.ts` full)
- [x] Credentials provider with bcrypt password verify (10 rounds)
- [x] JWT session with `id` augmentation on Session and JWT interfaces
- [x] Middleware enforces auth on all non-static routes (matcher excludes 
      api/_next/favicon)
- [x] `(auth)/layout.tsx` centered card layout
- [x] `(auth)/login/page.tsx` and `(auth)/signup/page.tsx` Server Components
- [x] `LoginForm.tsx` and `SignupForm.tsx` Client Components using 
      React 19's `useActionState` (NOT useFormState — that's deprecated v18)
- [x] `signupAction` and `loginAction` Server Actions in 
      `src/app/actions/auth.ts` with Zod validation, AuthError catch pattern
- [x] `(app)/layout.tsx` calls `auth()`, redirects unauthenticated to /login, 
      renders header with logout
- [x] `(app)/boards/page.tsx` placeholder shows "Hoş geldin, {name}"
- [x] `src/app/page.tsx` redirects to /boards (middleware handles auth)

### End-to-end auth flow tested:
1. `/` → middleware redirects to `/login` ✓
2. Signup form → user created in DB → auto-login → `/boards` ✓
3. Logout → back to `/login` ✓
4. Direct access to `/boards` while logged out → middleware redirects ✓
5. Login with correct creds → `/boards` ✓
6. Login with wrong password → "Email veya şifre hatalı" form error ✓
7. Signup with existing email → "Bu email zaten kayıtlı" error ✓

Verified in Prisma Studio: passwordHash stored as bcrypt `$2a$10$...` 
format, never plaintext.

## What's NOT done — next phases

### Phase 2 (next, this conversation)
**dnd-kit + fractional-indexing setup, Board/Column/Card CRUD, basic UI.**

Specifically:
- [ ] Install dnd-kit packages: 
      `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Install `fractional-indexing` and `sonner` (toasts) and `lucide-react`
- [ ] Server Actions for board/column/card create, update, delete
  - Owner check: every mutation verifies session.user.id matches resource owner
  - Position calculation uses `generateKeyBetween()` from fractional-indexing
- [ ] `/boards` list page — shows user's boards, "New Board" button
- [ ] `/boards/[boardId]` detail page — renders columns + cards
- [ ] Initial board view WITHOUT drag-drop (just CRUD + render)
- [ ] Card detail modal (title, description, due date — edit/save)

Once CRUD is solid and rendering works, THEN we add DnD.

### Phase 3 (after Phase 2)
**dnd-kit integration with optimistic UI.**

- [ ] DndContext + SortableContext at column level (cards) and board level (columns)
- [ ] PointerSensor + TouchSensor with activationConstraint: