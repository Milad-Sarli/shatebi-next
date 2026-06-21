# shatebiapp — شاطبی (Next.js Frontend)

## Stack

| Layer | Tech |
|-------|------|
| **Framework** | Next.js 15 (Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui (New York/neutral) |
| **State** | Zustand 5 (persist middleware) |
| **Animation** | Framer Motion 12 |
| **UI Components** | shadcn/ui, react-multi-date-picker (Jalali/Persian) |
| **Icons** | lucide-react |
| **Font** | Pinar (Persian) |
| **Direction** | RTL |

## Directory Structure

```
shatebiapp/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login/verify pages
│   │   ├── (dashboard)/        # Dashboard layout + pages
│   │   │   └── dashboard/
│   │   │       ├── juz/        # Juz reading system pages
│   │   │       ├── students/   # Student management
│   │   │       ├── optimizedClasses/ # Class management
│   │   │       ├── optimizedNumbers/ # Grade management
│   │   │       ├── week-absents/     # Absence tracking
│   │   │       └── ...
│   │   └── registration/       # Student registration
│   ├── components/
│   │   ├── ui/                 # shadcn/ui + custom components
│   │   └── dashboard/          # Dashboard-specific components
│   └── lib/
│       ├── services/           # API service classes
│       ├── store/              # Zustand stores
│       ├── context/            # React contexts (auth)
│       └── types/              # TypeScript types
└── .opencode/
    └── skills/
        └── design/             # Design system skill
```

## Backend API

| Key | Value |
|-----|-------|
| Dev URL | `http://localhost:8000` |
| Prod URL | `https://admin.shatebiapp.ir` |
| Auth | Sanctum (Bearer token) |
| Pagination | Paginated by default; use `paginate=off` for full lists |

API response format: `{ status: "success"|"error", data: ..., message?: ... }`
Paginated: `{ status: "success", data: { data: [...], current_page, last_page, total, per_page } }`

## Auth

- OTP-based login (phone → OTP → verify)
- Admin login with username + password
- Zustand persist stores token in `localStorage['auth-storage']`
- API token passed in `Authorization: Bearer <token>` header
- `useAuth()` context provides `accessToken`, `user`, `login`, `logout`, etc.
- `JuzService` reads token directly from localStorage via `getToken()`

## Juz' Reading System

Pages at `/dashboard/juz/`:
- **Dashboard** (`page.tsx`): Stats cards, juz distribution chart, weekly completion
- **Assignments** (`assignments/page.tsx`): Create/view weekly juz assignments (matrix editor with students × days), loading existing assignments + progress via "بارگذاری برنامه" button
- **Reading Logs** (`reading-logs/page.tsx`): Log and verify student juz readings

Key services: `JuzService` (juz.service.ts), `StudentService` (student.service.ts)

## Design System

See `.opencode/skills/design/SKILL.md` for full design system details.
- Colors: CSS variables (`--color-*`), Tailwind v4
- Dark mode: `prefers-color-scheme` + manual toggle
- RTL: `dir="rtl"` throughout
- Date picker: `react-multi-date-picker` with Persian calendar (via `DateSelector` component)

## Local Development

```bash
npm run dev          # default port 3009 (could be 3003 on production)
npm run build        # production build
npm run lint         # lint check
```

```bash
# If port is stuck, kill and restart:
lsof -ti :3009 | xargs kill -9
npm run dev -- --port 3010
```

## Server (Production)

| Key | Value |
|-----|-------|
| Host | `178.239.147.149` |
| User | `root` |
| Path | `/var/www/shatebiapp.ir` |
| PM2 | `shatebiapp-frontend` |
| Port | 3003 (via PM2) |

## Deployment

Deploy via backend repo's `deploy.sh`:
```bash
cd ../admin-shatebiapp
./deploy.sh frontend   # build + rsync + pm2 restart
./deploy.sh both       # frontend + backend
```

## OpenCode Setup (for collaborators)

### Prerequisites
- [OpenCode CLI](https://opencode.ai) installed
- Node.js 22+
- A model provider key (Claude, GPT, Gemini, or Zen)

### Skills in this repo
The `.opencode/skills/design/` skill is committed in this repo and auto-loaded when working in this directory.

### Recommended global skills (install via opencode)
Skills from `~/.opencode/skills/` used in this project:
- `nextjs-frontend-stack` — Next.js + SWR + Zustand + shadcn/ui patterns
- `design` — Design system skill (also in project)
- `persian-ecommerce` — Persian e-commerce patterns
- `image-processing` — Intervention Image patterns (backend)

### GSD Workflow (optional)
This project uses GSD (Guided Software Development) for structured planning. Install via:
```bash
npx gsd-core install
```
See `.claude/skills/gsd-*` for available commands.

### Environment
Copy `.env.example` to `.env` and configure:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
# or for production:
# NEXT_PUBLIC_API_URL=https://admin.shatebiapp.ir
```
