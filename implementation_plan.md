# SDD — Control Electoral Web App

## 1. Overview

A multi-operator web application for managing the logistics of an electoral oversight event. Operators use it simultaneously to:
- Maintain a census of **collaborators** (MJRVs and Coordinators).
- Organize **MJRVs** to cover all *Juntas* across each *Recinto*.
- Assign **Coordinators** to support MJRVs at each *Recinto*.
- Track phone/WhatsApp contact status and training attendance.

---

## 2. Observations & Suggested Improvements

> [!NOTE]
> The following items were identified in `Descripcion.md`. Please review and confirm how you'd like to handle each before execution begins.

### 2.1 Issues Found

| # | Location | Issue | Suggestion |
|---|----------|--------|------------|
| 1 | `ObservacionesColaboradores` table | The table definition is incomplete — it only lists `ID` and `ID_Colaborador` but no content/text field. | Add a `texto →String` field and a `created_at →Timestamp` field so observations have actual content and can be ordered chronologically. |
| 2 | `Recintos` table | The table has no `Estado` field, but the Recintos list view shows "Estado" as a column and filtering by Estado (Active/Inactive) is required. | Add `Estado →String` to the `Recintos` table (default `'Activo'`). |
| 3 | `Colaboradores` → juntas assigned | The description says MJRV collaborators are assigned a *range* of junta numbers, but the schema stores individual `AsignacionJunta` records (one per junta). The range display format `"5M-10M, 5F-10F"` is computed. | This is fine architecturally — we'll insert one `AsignacionJunta` row per junta within the range. Display is computed on the frontend. Need to confirm: when a range is selected (e.g., 5–10M), should *every* junta in that range be assigned (individual rows), or just stored as a range (start/end)? I recommend individual rows for max flexibility. |
| 4 | Sidebar menu | "Ingresar información" sub-menu lists `Colaboradores, Recintos, Parroquias` but the top-level list also has separate `Colaboradores`, `Parroquias`, `Recintos` for viewing. The sidebar should distinguish `Ingresar` vs `Ver`. | Clarify UX intent: should `Colaboradores (ver)` be a separate link or reached via a "view" button on the Ingresar page? Current plan: keep separate nav items as described. |
| 5 | Login | "Solo se usará una cuenta para todos los operadores" — using Supabase Auth with a single shared email/password is feasible but means no per-operator audit trail. | Acceptable for now. We'll use Supabase Auth with one account. Add a note in code that multi-user auth can be added later. |
| 6 | WhatsApp field | Validated as "10 dígitos" (Ecuador standard). If deployed elsewhere, this may need adjustment. | We'll validate exactly 10 numeric digits client-side and server-side (DB check constraint). |

### 2.2 Proposed Additions

- **`Parroquias` → `Estado` field already listed** ✅ — defaults to `'Activo'`.
- **Timestamps**: Add `created_at` to all tables for auditability.
- **Soft-delete convention**: `Estado` fields use values `'Activo'` / `'Inactivo'` consistently.

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v3 |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| Type Safety | TypeScript |
| Deployment (future) | Vercel |
| DB Types | Auto-generated from Supabase (`supabase gen types typescript`) |

---

## 4. Database Schema

### 4.1 Entity-Relationship Overview

```
Parroquias ──< Recintos ──< Juntas ──< AsignacionJunta >── Colaboradores
                                                              |
                                                        ObservacionesColaboradores
```

### 4.2 Table Definitions (Final)

#### `parroquias`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `nombre` | `text` NOT NULL | |
| `tipo` | `text` NOT NULL | `'Urbana'` \| `'Rural'` |
| `estado` | `text` NOT NULL | default `'Activo'` |
| `created_at` | `timestamptz` | default `now()` |

#### `recintos`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `nombre` | `text` NOT NULL | |
| `id_parroquia` | `uuid` FK → `parroquias.id` | |
| `estado` | `text` NOT NULL | default `'Activo'` *(added — see Observation #2)* |
| `created_at` | `timestamptz` | default `now()` |

#### `juntas`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `id_recinto` | `uuid` FK → `recintos.id` | |
| `numero` | `integer` NOT NULL | 1–70 |
| `sexo` | `text` NOT NULL | `'M'` \| `'F'` |
| `estado` | `text` NOT NULL | default `'Activo'` |
| `created_at` | `timestamptz` | default `now()` |
| **UNIQUE** | | `(id_recinto, numero, sexo)` |

#### `colaboradores`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `apellidos` | `text` NOT NULL | |
| `nombres` | `text` NOT NULL | |
| `whatsapp` | `text` NOT NULL | CHECK `whatsapp ~ '^\d{10}$'` |
| `ya_contactado` | `text` NOT NULL | default `'No'`; values: `'Sí'`, `'No'`, `'No responde'`, `'Volver a contactar'` |
| `rol` | `text` NOT NULL | `'Coordinador'` \| `'MJRV'` |
| `id_recinto_asignado` | `uuid` FK → `recintos.id` | nullable |
| `asiste_capacitacion` | `text` NOT NULL | default `'No'`; values: `'Sí'`, `'No'` |
| `created_at` | `timestamptz` | default `now()` |

> [!NOTE]
> The description mentions both "Recinto de Votación" and "Recinto Asignado" for collaborators. The schema only has one `id_recinto`. I'll add **two separate FK columns**: `id_recinto_votacion` (where they vote) and `id_recinto_asignado` (where they're assigned to work).

#### `asignacion_juntas`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `id_colaborador` | `uuid` FK → `colaboradores.id` | |
| `id_junta` | `uuid` FK → `juntas.id` | |
| `estado` | `text` NOT NULL | default `'Activo'` |
| `created_at` | `timestamptz` | default `now()` |

#### `observaciones_colaboradores`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | default `gen_random_uuid()` |
| `id_colaborador` | `uuid` FK → `colaboradores.id` | |
| `texto` | `text` NOT NULL | *(added — see Observation #1)* |
| `created_at` | `timestamptz` | default `now()` |

### 4.3 RLS Policies

Since there is a single shared account, we will enable RLS on all tables and apply a simple **authenticated user** policy: any logged-in user can SELECT, INSERT, UPDATE, DELETE. This keeps the app secure (no public access) while allowing all operators to work.

---

## 5. Application Architecture

### 5.1 Project Structure (Next.js App Router)

```
controlElectoral/
├── app/
│   ├── layout.tsx                  # Root layout (font, global styles)
│   ├── page.tsx                    # Redirect → /login or /dashboard
│   ├── login/
│   │   └── page.tsx                # Login page
│   ├── (protected)/                # Route group — requires auth
│   │   ├── layout.tsx              # Sidebar + main panel layout
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Placeholder dashboard
│   │   ├── parroquias/
│   │   │   ├── page.tsx            # List of parroquias
│   │   │   ├── nueva/page.tsx      # Form: Ingresar parroquia
│   │   │   └── [id]/page.tsx       # Ver/Editar parroquia
│   │   ├── recintos/
│   │   │   ├── page.tsx            # List of recintos
│   │   │   ├── nuevo/page.tsx      # Form: Ingresar recinto
│   │   │   └── [id]/page.tsx       # Ver/Editar recinto
│   │   └── colaboradores/
│   │       ├── page.tsx            # List of colaboradores (paginated)
│   │       ├── nuevo/page.tsx      # Form: Ingresar colaborador
│   │       └── [id]/page.tsx       # Ver/Editar colaborador
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── ui/
│   │   ├── Toast.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── RangeSelector.tsx       # Custom junta range picker
│   ├── parroquias/
│   │   ├── ParroquiaForm.tsx
│   │   └── ParroquiaTable.tsx
│   ├── recintos/
│   │   ├── RecintoForm.tsx
│   │   └── RecintoTable.tsx
│   └── colaboradores/
│       ├── ColaboradorForm.tsx
│       ├── ColaboradorTable.tsx
│       └── ObservacionesInput.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (SSR)
│   │   └── middleware.ts           # Auth middleware
│   └── utils.ts                    # Shared helpers
├── types/
│   └── database.types.ts           # Auto-generated from Supabase
├── middleware.ts                    # Route protection
├── tailwind.config.ts
└── next.config.ts
```

### 5.2 Data Flow

- **Server Components** fetch initial data from Supabase using the server client (SSR).
- **Client Components** handle forms, toasts, and interactive controls (dropdowns, range selectors).
- **Supabase Auth** session is managed via `@supabase/ssr` with middleware for route protection.

---

## 6. Page-by-Page Design

### 6.1 Login (`/login`)
- Email + Password form.
- On success → redirect to `/dashboard`.
- On error → inline error message.

### 6.2 Sidebar Navigation
```
▼ Ingresar
    Parroquias
    Recintos
    Colaboradores
━━━━━━━━━━━━━━
  Parroquias
  Recintos
  Colaboradores
  Dashboard
```

### 6.3 Parroquias — List (`/parroquias`)
- Filters: `Estado` (Activa / Inactiva / Todos), `Tipo` (Urbana / Rural / Todos).
- Columns: Nombre, Tipo, # Recintos, # Juntas, Estado, [Ver] [Editar].
- `# Recintos` and `# Juntas` computed via Supabase view or aggregation query.

### 6.4 Parroquias — Nueva (`/parroquias/nueva`)
- Fields: Nombre (text), Tipo (toggle Urbana/Rural).
- Button: "Ingresar".

### 6.5 Parroquias — Ver/Editar (`/parroquias/[id]`)
- Read-only view by default. "Editar" button enables inline editing.
- Fields: Nombre, Tipo, # Recintos (read-only), # Juntas (read-only).

### 6.6 Recintos — List (`/recintos`)
- Filters: Estado, Parroquia, Nombre (search).
- Columns: Nombre, Parroquia, # Juntas, Estado, [Ver] [Editar].

### 6.7 Recintos — Nuevo (`/recintos/nuevo`)
- Fields: Nombre, Parroquia (dropdown), Juntas M (0–70), Juntas F (0–70).
- Transactional create: `recintos` row + all `juntas` rows via Supabase RPC (stored procedure).

### 6.8 Recintos — Ver/Editar (`/recintos/[id]`)
- Fields: Nombre, Parroquia (dropdown), Juntas M, Juntas F.
- On junta count reduction → mark extra juntas as `'Inactivo'` via RPC.

### 6.9 Colaboradores — List (`/colaboradores`)
- Filters: Nombre (search), Ya contactado, Rol, Recinto, Parroquia, Asiste capacitación.
- Columns: Nombre + Apellidos, WhatsApp, Ya contactado, Rol, Recinto, Parroquia, Rango juntas.
- Pagination: 100 per page.
- Rango juntas format: `"5M–10M, 3F–8F"` computed by grouping consecutive assigned junta numbers.

### 6.10 Colaboradores — Nuevo (`/colaboradores/nuevo`)
- Fields per spec: Apellidos, Nombres, WhatsApp, Rol (radio), Recinto Votación (dropdown), Recinto Asignado (dropdown), Juntas M range + Juntas F range *(visible only if Rol = MJRV)*, Observaciones (add multiple).
- Transactional: `colaboradores` + `asignacion_juntas` (one row per junta in range) + `observaciones_colaboradores`.

### 6.11 Colaboradores — Ver/Editar (`/colaboradores/[id]`)
- Fields per spec with edit mode.
- `Ya contactado`: radio with 4 options.
- Juntas range selectors.
- Observaciones: list existing + add new.

---

## 7. Key UI Components

### 7.1 `RangeSelector`
A custom component for selecting a range of junta numbers (e.g., 1–15 for M, 1–10 for F).
- Shows two number inputs: "Desde" and "Hasta".
- Max value constrained by the number of juntas in the selected recinto.
- Only active when `Rol = MJRV`.

### 7.2 `ObservacionesInput`
- Shows existing observations as a timestamped list.
- "+" button to add a new text observation.
- In edit mode, allows adding (not deleting, to preserve history).

### 7.3 Toast Notifications
- Used for form submission errors and successes.
- Displayed inside the page content area (not browser alerts).

---

## 8. Supabase Setup

### 8.1 Project
- Use existing MCP connection. A **new Supabase project** will be created for this app (separate from `proformapp`).

### 8.2 Auth
- Enable Email auth provider.
- Create one initial user account via Supabase dashboard.
- Protect routes with Next.js middleware using `@supabase/ssr`.

### 8.3 Database Functions (RPCs)
| Function | Purpose |
|----------|---------|
| `create_recinto_with_juntas(nombre, id_parroquia, juntas_m, juntas_f)` | Atomically create recinto + all junta rows |
| `update_juntas_count(id_recinto, new_m, new_f)` | Adjust junta count, marking removed ones inactive |
| `create_colaborador_full(...)` | Atomically create colaborador + junta assignments + observations |

### 8.4 Views (optional, for performance)
| View | Purpose |
|------|---------|
| `parroquias_summary` | Includes recinto count and total junta count per parroquia |
| `recintos_summary` | Includes total junta count per recinto |

---

## 9. Phased Execution Plan

### Phase 1 — Project Scaffold
- [ ] Initialize Next.js 14 project with TypeScript and Tailwind.
- [ ] Configure Supabase client (`@supabase/ssr`).
- [ ] Set up middleware for auth protection.
- [ ] Create sidebar layout component.

### Phase 2 — Database
- [ ] Create new Supabase project.
- [ ] Apply migrations for all 6 tables.
- [ ] Create RPCs for transactional operations.
- [ ] Enable RLS with authenticated-user policies.
- [ ] Generate TypeScript types.

### Phase 3 — Auth
- [ ] Build login page.
- [ ] Implement route protection middleware.

### Phase 4 — Parroquias Module
- [ ] List page with filters.
- [ ] Nueva parroquia form.
- [ ] Ver/Editar parroquia page.

### Phase 5 — Recintos Module
- [ ] List page with filters.
- [ ] Nuevo recinto form (transactional).
- [ ] Ver/Editar recinto (junta adjustment logic).

### Phase 6 — Colaboradores Module
- [ ] List page with filters and pagination.
- [ ] Nuevo colaborador form (range selector, observations).
- [ ] Ver/Editar colaborador.

### Phase 7 — Polish & QA
- [ ] Toast error handling across all forms.
- [ ] Responsive layout check.
- [ ] Final review of RLS policies and security advisors.

---

## 10. Open Questions

> [!IMPORTANT]
> **Q1 — Two Recintos on Colaborador form**: The description mentions both "Recinto Votación" (where collaborator votes) and "Recinto Asignado" (where they're assigned to work). The DB schema only has one `id_recinto`. Should I add **two separate columns** (`id_recinto_votacion` and `id_recinto_asignado`), or is `id_recinto` only the assigned recinto and the voting recinto is not stored?

> [!IMPORTANT]
> **Q2 — Junta range assignment**: When a range like 5–10M is selected, should each junta (5M, 6M, 7M, 8M, 9M, 10M) get its own `asignacion_juntas` row, or should we store just the start/end as two columns on a single row? Individual rows give maximum flexibility (e.g., assigning non-contiguous juntas in the future).

> [!IMPORTANT]
> **Q3 — ObservacionesColaboradores**: Can observations be **edited or deleted** after being saved, or are they append-only (immutable history)? The description says "multiple observations" but doesn't specify mutability.

> [!NOTE]
> **Q4 — Coordinador juntas**: The description says junta selectors are only active for MJRVs. Should a Coordinador ever have juntas assigned, or is the Recinto assignment enough for them?

> [!NOTE]
> **Q5 — Supabase project**: Should I create a **new Supabase project** for this app, or reuse the existing `proformapp` project with a separate schema?
