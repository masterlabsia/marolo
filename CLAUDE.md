# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend (root)
npm run dev          # dev server on port 3080
npm run build        # production build (runs Supabase env check first)
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)

# Banco local (Supabase CLI via Docker)
npm run db:start     # sobe containers locais (postgres, auth, storage…)
npm run db:stop      # para os containers
npm run db:reset     # recria o schema + executa seed.sql
npm run db:status    # exibe URLs e chaves do ambiente local

# Backend (Node/Express — separado, não consumido pelo frontend)
cd backend && npm install && npm run dev
```

Tests live in `src/**/*.{test,spec}.{ts,tsx}` and use jsdom + @testing-library/react. The `@` alias resolves to `./src/`.

## Desenvolvimento local com banco local

Para desenvolver desconectado do Supabase cloud:

```bash
npm run db:start          # 1. sobe containers (~1 min na primeira vez)
npm run db:status         # 2. copia a "anon key" exibida
# 3. edite .env.local:
#    VITE_SUPABASE_URL=http://localhost:54321
#    VITE_SUPABASE_ANON_KEY=<anon key do db:status>
npm run dev               # 4. frontend na porta 3080 apontando pro banco local
```

Para resetar o banco e recarregar dados de teste (`supabase/seed.sql`):
```bash
npm run db:reset
```

Migrations ficam em `supabase/migrations/` — cada arquivo é executado em ordem pelo `db:reset`. Para criar uma nova migration:
```bash
npx supabase migration new nome_da_migration
```

## Architecture

This is a **React SPA** (Vite + TypeScript + shadcn-ui + Tailwind) that talks **directly to Supabase** for auth, data, and access control. There is also a standalone Express backend (`backend/`) that mirrors the same domain operations — it is not currently consumed by the frontend (which uses Supabase directly via `src/lib/team-api.ts`).

### Data flow

```
src/pages/* → React Query hooks → src/lib/team-api.ts → supabase-js → Supabase cloud
```

- `src/lib/supabase.ts` — single Supabase client; exports `isSupabaseConfigured` to gate operations when env vars are missing.
- `src/lib/team-api.ts` — all Supabase CRUD calls. Every query is scoped to a `perfil_id` (team), enforcing data isolation per team.
- `src/hooks/useAuth.tsx` — wraps Supabase Auth in a React Context (`AuthProvider`). Provides `user`, `session`, `loading`, and auth actions.
- `src/hooks/useProfile.ts` — React Query hook that resolves the current user's `Perfil` (team) and `Papel` (role: `"admin"` | `"jogador"` | `"diarista"`). Admin = the user whose `usuario_id` matches `perfis.usuario_id`; other users look up `membros` table.
- `src/lib/permissions.ts` — thin helper; `canManageRole(role)` returns true only for `"admin"`.

### Multi-tenancy model

Each team is a `Perfil` row. All domain tables (`jogadores`, `jogos`, `presencas`, `pagamentos`, `caixa`) have a `perfil_id` FK. Access control is enforced by Supabase RLS policies (defined in `backend/src/db/schema.sql`) — never rely solely on the frontend `role` state for security.

### Domain types (`src/types/domain.ts`)

`Perfil` → `Jogador` → `Jogo` → `Presenca` (attendance + stats per game).
`Pagamento` (monthly dues, with carry-forward of outstanding amounts via `bulkCreateMensalidades`).
`MovimentacaoCaixa` (cash register entries, `entrada` | `saida`).

### Auth & routing

All routes except `/auth/login` are wrapped in `<ProtectedRoute>`. The `LoginRedirect` component in `App.tsx` redirects authenticated users away from the login page. An expired OTP URL (`#error=access_denied`) is cleared by the app automatically.

### Offline presence queue

`src/lib/offline-queue.ts` queues `Presenca` upserts in `localStorage` under `marolo_offline_presence_queue_v1` when the app is offline and flushes them when connectivity returns.

### Environment variables

Frontend (required for all Supabase calls):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Netlify build runs `scripts/check-supabase-env.cjs` before `vite build` to fail fast if these are missing.

### Database schema

Run all of `backend/src/db/schema.sql` in the Supabase SQL Editor to create tables (`perfis`, `jogadores`, `jogos`, `membros`, `caixa`, `pagamentos`, `presencas`) and their RLS policies. Optional seed data is in `backend/src/db/seed_single_team.sql`.

## Security rules (from Cursor rules)

- Never put private keys (Service Role, etc.) in `VITE_` env vars — they are exposed in the final bundle.
- Never use `dangerouslySetInnerHTML` without `DOMPurify` sanitization.
- RLS policies on Supabase are the real authorization boundary; `role` in React state is visual-only.
- Any `if (user.isAdmin)` guard on the frontend must be paired with a backend/RLS check — add a comment noting this.
- Filter sensitive data at the database level (RLS / select projections), not with `.filter()` in JavaScript after fetching.
