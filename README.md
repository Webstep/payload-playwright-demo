# Payload + Playwright demo

A lightweight, free Payload CMS (MIT license) setup for Playwright API/UI testing.

---

## What are secrets and why do they matter?

A **secret** is a piece of sensitive information that your application needs to run — passwords, encryption keys, API tokens.

The golden rule is: **never put secrets directly in your code or commit them to Git.**

Why? Because code pushed to GitHub/GitLab is often visible to many people. If a secret is in a file like `docker-compose.yml` or `server.ts`, anyone who can read the code can see it. For a password this means their account is compromised. For an encryption key, all the data it protects is compromised.

Instead you store secrets in the **environment** — a separate place that exists only on the machine or service that needs it. Your code reads the value from that environment at runtime without ever containing the value itself.

This project uses three values that are treated as secrets/config:

| Variable | What it is | Sensitive? |
|---|---|---|
| `PAYLOAD_SECRET` | A long random string Payload uses to sign login tokens. Like a master key. | **Yes — keep secret** |
| `ADMIN_EMAIL` | The email address for the auto-created admin user | No |
| `ADMIN_PASSWORD` | The password for the auto-created admin user | Yes for production, fine as default for local dev |

---

## 1) Prerequisites

- Docker Desktop (Linux engine running)
- Node.js 20+

---

## 2) Local setup — VS Code / your machine

### Step 1 — Create your local `.env` file

The `.env` file is how you pass secrets to Docker Compose on your own machine. It is listed in `.gitignore` so it will never be committed to Git.

In the root of the project, copy the example file:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac / Linux:**
```bash
cp .env.example .env
```

### Step 2 — Edit the `.env` file

Open [.env](.env) in VS Code and fill in real values:

```
PAYLOAD_SECRET=some-long-random-string-change-this
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
MONGODB_URI=mongodb://mongo:27017/payload
```

For `PAYLOAD_SECRET`, generate something random — any long string works locally, e.g. `my-super-secret-dev-key-12345`.

> **Never commit this file.** `.gitignore` already excludes it, but double-check by running `git status` — `.env` should not appear.

### Step 3 — Start services

```powershell
docker compose up -d --build
```

On first run, the app automatically creates the admin user using the email/password from your `.env`.

Open the admin panel: http://localhost:3000/admin

### Step 4 — Run tests

Install Playwright browsers once:

```bash
npx playwright install
```

Run all tests:

```bash
npm test
```

Or by scope:

```bash
npm run test:api
npm run test:auth
npm run test:posts
```

---

## 3) GitHub Actions setup — for your team's CI pipeline

When tests run automatically on GitHub (on every push or pull request), the `.env` file is not available — it only exists on your local machine. Instead, you store secrets directly in GitHub so the pipeline can access them securely.

### Step 1 — Add `PAYLOAD_SECRET` as a GitHub Secret

1. Go to your repository on GitHub.
2. Click **Settings** (top menu of the repo, not your account settings).
3. In the left sidebar, click **Secrets and variables → Actions**.
4. Click **New repository secret**.
5. Name: `PAYLOAD_SECRET`
6. Value: paste the same value you used in your `.env` file.
7. Click **Add secret**.

Secrets are encrypted by GitHub. Nobody can read them back — not even you — once saved. The pipeline can use them but they are masked in logs.

### Step 2 — (Optional) Override admin credentials

The pipeline defaults to `admin@example.com` / `password`. If you want different values:

1. On the same **Secrets and variables → Actions** page, click the **Variables** tab.
2. Click **New repository variable**.
3. Add `ADMIN_EMAIL` and/or `ADMIN_PASSWORD` as plain variables (not secrets, since they aren't sensitive for a dev environment).

### Step 3 — Push and watch it run

Commit and push your code. GitHub will automatically run the Playwright tests on every push to `main`/`master` and every pull request.

To see results: go to your repository → **Actions** tab.

---

## 4) Useful Docker commands

```bash
docker compose up -d        # start in background
docker compose down         # stop and remove containers
docker compose logs -f payload  # follow live logs
```

Reset database (clears all data including the admin user):

```bash
docker compose down -v
```
## urls to use

http://localhost:3000	Redirects to shop

http://localhost:3000/shop	Product grid with category filter buttons

http://localhost:3000/shop?category=electronics	Filtered product list

http://localhost:3000/shop/products/[<id>](http://_vscodecontentref_/0)	Product detail with Add to cart / Out of stock

http://localhost:3000/shop/orders	Orders table with status badges

http://localhost:3000/admin	CMS admin panel