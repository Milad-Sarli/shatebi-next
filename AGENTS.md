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

> ⚠️ **CRITICAL: Always ask for permission before deploying to production!**
> ⚠️ **CRITICAL: Never run `npm run build` without asking — it overwrites `.next/` and crashes the local dev server.**

```bash
npm run dev          # default port 3009 (could be 3003 on production)
npm run build        # production build (ask first!)
npm run lint         # lint check
```

> ⚠️ **WARNING**: `npm run build` overwrites `.next/` and will crash the running dev server.
> Always restart after build: `pm2 restart shatebi-frontend`

```bash
# If port is stuck, kill and restart:
pm2 restart shatebi-frontend
# or force:
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

## Database Sync (از سرور به local)

پایگاه داده رایگان و جدید برای توسعه:

```bash
# یکبار: نصب اسکریپت روی سرور
scp sync-dbs.sh root@178.239.147.149:/usr/local/bin/sync-dbs.sh
ssh root@178.239.147.149 "chmod +x /usr/local/bin/sync-dbs.sh"

# دریافت دیتابیس‌ها (همه):
./sync-dbs-local.sh

# یا فقط یک دیتابیس:
./sync-dbs-local.sh shatebiapp.ir
./sync-dbs-local.sh kralmode.com
./sync-dbs-local.sh pedyar.com
./sync-dbs-local.sh itemer.ir
```

**فایل‌ها:**
- `sync-dbs.sh` → سرور: dump + compress همه دیتابیس‌ها
- `sync-dbs-local.sh` → محلی: دانلود + import به DBngin MySQL

**نیازمندی‌ها:** DBngin MySQL (سوکت `/tmp/mysql_3306.sock`)، SSH key `~/.ssh/id_ed25519_2026`.

**MySQL password (admin):** `bf38@2951@a96a@4a36Aa1`

## Security (Malware Incident - July 2026)

**Incident:** Server was repeatedly compromised by a hacker (Iranian IP ranges) who:
- Uploaded webshells (Modern Premium PHP File Manager) into public directories
- Planted a backdoor in `changepass/{username}` route (password reset to `12345678`)
- Installed systemd malware (komari) connecting to `dash.little.army`
- Created malicious cron (`/etc/cron.d/auto-upgrade`, immutable) pulling from `0x1x2x3.top`
- Replaced system binaries (bash, dash, python3.12, mysqld) with empty files
- Exploited `rise3.9` CodeIgniter project on port 9000 (open to world, no domain, no SSL)

**Root cause:** Port 9000 (`rise3.9` project) was open with `server_name _;`, no SSL, old CodeIgniter 3 with vulnerable `dev-master` package.

**Server hardening (Jul 17-18, 2026):**
- Port 9000 CLOSED (UFW deny + nginx)
- 16+ hacker IPs + `94.101.176.0/20` + `185.215.232.0/24` blocked via UFW
- fail2ban SSH: 3 retries → 24h ban; `ufw limit 22/tcp`
- System binaries restored (bash, dash, mysqld, python3.12)
- MySQL password rotated; all 4 Laravel APP_KEYs regenerated
- 2 webshells deleted & quarantined; `changepass` backdoor removed
- komari malware + malicious cron disabled (immutable)
- C2 domains blocked in immutable `/etc/hosts`
- Security monitoring: integrity-check (daily), webshell-watch (2min), malware-watch (2s)
- Google Drive daily backup at 3am
- Docker + n8n removed; Telegram + Pusher removed; Bale restored
- All security scripts immutable (`chattr +i`)

**Symptoms to watch for:**
- PM2 restart count spiking (was 47,000+ restarts)
- 504 Gateway Timeout errors
- Suspicious files in `/tmp/.e*` or `/tmp/cheddar`
- PM2 error logs showing `base64` decode or `curl/wget` to external IPs
- 403 errors in nginx access log (webshell pattern blocked)

**If malware returns:**
```bash
# 1. Check for signs
tail -20 /var/log/webshell-watch.log
tail -20 /var/log/integrity-check.log
ls -la /tmp/.e* /tmp/cheddar 2>/dev/null
pm2 logs shatebiapp-frontend --err --lines 50 --nostream

# 2. Stop PM2 and clean
pm2 stop shatebiapp-frontend
rm -rf /var/www/shatebiapp.ir/.next
rm -rf /tmp/.e* /tmp/cheddar

# 3. Rebuild locally and deploy clean
npm run build
rsync -avz --delete .next/ root@178.239.147.149:/var/www/shatebiapp.ir/.next/
pm2 restart shatebiapp-frontend
```

**Important:** Always build locally and deploy — never run `npm run build` on the server (no internet access).
