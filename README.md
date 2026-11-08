# MRT M&E System

Monitoring and Evaluation System for the Miri Roshni Trust.

## Quick Start (Development)

Start Docker Desktop or Docker Engine, then run this from the project directory.

```bash
docker compose up -d
docker compose logs -f app
```

The app container installs dependencies from the lockfile, waits for PostgreSQL, applies the checked-in migrations, and seeds the development administrator. Local code edits are picked up by Next.js while the container runs.

Once Next.js reports that it is ready, open [localhost:3000](http://localhost:3000) and sign in with `admin@mrt.org` and `admin123`. Use `docker compose down` to stop the stack and keep the database volume.

## Production Deployment
```bash
cp .env.production .env
# Edit .env with your specific values (e.g., strong NEXTAUTH_SECRET)
docker-compose -f docker-compose.prod.yml up -d --build
```
This runs the application stack, including PostgreSQL, Next.js Node server, and an Nginx reverse proxy.

## Project Structure
```
mrt-system/
├── app/               # Next.js App Router
│   ├── (auth)/        # Authentication pages
│   ├── api/           # API Routes
│   └── dashboard/     # Main dashboard interface
├── components/        # Reusable UI components
├── lib/               # Utilities (Prisma, Auth, etc)
├── prisma/            # Database schema & migrations
├── public/            # Static assets
└── scripts/           # Deployment & utility scripts
```

## User Roles & Access
| Role | Access Level | Description |
|------|--------------|-------------|
| `SUPER_ADMIN` | Full System | Total control over all modules and user management. |
| `TRUST_MGMT` | Full Data | View/edit access across all trust programs. No user management. |
| `PROGRAM_MANAGER` | Program Level | Manages specific programs (e.g., RFL, MRA). |
| `MEO_OFFICER` | Evaluation | Access to analytics and reporting for evaluation. |
| `SCHOOL_AUTHORITY` | MRHSS Only | Access scoped to school management module. |
| `HOSTEL_INCHARGE` | MRHSS Hostel | Access to hostel and student wellbeing data. |
| `RFL_COORDINATOR` | RFL Only | Full access to RFL participants, mentorships, and alumni. |

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js
- **State/Data Fetching:** React Server Components + Client Hooks
- **Icons:** Lucide React
- **Notifications:** Sonner Toasts
- **Deployment:** Docker Multi-stage + Docker Compose
