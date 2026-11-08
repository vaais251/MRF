# Comprehensive Setup Guide: MRT M&E System

This guide outlines the exact, step-by-step process required to take this codebase to a completely new machine and get the MRT project running from scratch.

## Prerequisites
Before you start, ensure the new machine has the following installed:
1. **Docker Desktop** (or Docker Engine & Docker Compose on Linux)
2. **Git** (if you need to clone the repository)

You do **NOT** need Node.js or PostgreSQL installed on your host machine, as everything will run securely inside Docker containers.

---

## Method 1: Production Deployment (Recommended for completely new machines)

This is the easiest and most robust way to run the application on a new machine. It builds the complete stack (App, PostgreSQL Database, Nginx Reverse Proxy) and automatically handles database migrations and seeding.

### Step 1: Prepare the Environment
1. Open your terminal or command prompt and navigate to the project directory:
   ```bash
   cd path/to/mrt-system
   ```
2. Create your environment variables file by copying the production template:
   ```bash
   cp .env.production .env
   ```
   *(If you are on Windows Command Prompt, use `copy .env.production .env` instead)*

### Step 2: Build and Start the Containers
Run the following command to build the Docker images and start the services in detached mode:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
**What happens here?**
- Docker pulls the necessary `node`, `postgres`, and `nginx` images.
- It builds the Next.js application.
- It automatically executes `./scripts/migrate-and-seed.sh`, which runs Prisma migrations and seeds the database with the default Super Admin user.

### Step 3: Verify the Application
Wait a few moments for the Next.js build and database seeding to complete. You can check the logs to confirm:
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```

### Step 4: Access the Project
Open your web browser and navigate to:
**http://localhost**

You can log in using the freshly seeded administrator credentials:
- **Email:** `admin@mrt.org`
- **Password:** `admin123`

---

## Method 2: Development Environment (Best for making code changes)

If you are moving the codebase to a new machine to continue development, use this method. It mounts your local files into the container so that changes update in real-time.

### Step 1. Start the development stack

With Docker running, run these commands from the project directory.

```bash
docker compose up -d
docker compose logs -f app
```

Compose supplies the local environment variables and starts PostgreSQL. Once PostgreSQL is ready, the app container installs dependencies with `npm ci`, generates Prisma Client, applies the existing migrations, seeds the administrator, and starts Next.js with hot reload.

### Step 2. Sign in

Once Next.js reports that it is ready, open [localhost:3000](http://localhost:3000).

Log in using the seeded credentials:
- **Email:** `admin@mrt.org`
- **Password:** `admin123`

---

## Useful Docker Commands to Remember

- **Stop all services:**
  ```bash
  docker-compose down
  ```
  *(Add `-f docker-compose.prod.yml` if you used the production compose file)*

- **Wipe the database and start completely fresh:**
  ```bash
  docker-compose down -v
  ```
  *(The `-v` flag removes the mounted Docker volumes where the PostgreSQL data is stored).*

- **View container logs:**
  ```bash
  docker-compose logs -f
  ```

- **Open a shell inside the Next.js container (for debugging):**
  ```bash
  docker-compose exec app sh
  ```
