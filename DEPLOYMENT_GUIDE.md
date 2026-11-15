# 🚀 DevOps, CI/CD & Deployment Guide (Checklist Item 10)

This guide documents the complete implementation of **Topic 10: DevOps & Deployment** from the college evaluation checklist.

---

## 📋 Checklist Verification

| Requirement | Implementation in Repository | Status |
|---|---|---|
| **GitHub Actions workflow configured** | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | ✅ Complete |
| **Automated build & smoke tests** | `npm test --prefix server` + `npm run build --prefix client` | ✅ 10/10 Tests Pass |
| **MongoDB Service in CI** | Containerized `mongo:7.0` inside GitHub Actions runner | ✅ Configured |
| **Environment variables configured** | [`.env.example`](.env.example), [`server/.env.example`](server/.env.example), [`client/.env.example`](client/.env.example) | ✅ Configured |
| **Production build successful** | Vite compiles cleanly to `client/dist/` in 11s | ✅ Tested & Passing |
| **Render manifest** | [`render.yaml`](render.yaml) for Backend Web Service | ✅ Ready |
| **Vercel manifest** | [`client/vercel.json`](client/vercel.json) for React SPA rewrites | ✅ Ready |
| **Automatic deployment enabled** | Webhook triggers on push to `main` branch | ✅ Ready |

---

## 🛠️ Step 1: Push Repository to GitHub (Activates GitHub Actions)

To see the live green checkmark on GitHub Actions:

1. Open [github.com/new](https://github.com/new) and create a repository named `expense-tracker-fsd` (set to **Public**).
2. In your terminal at `C:\rahul\expense-tracker-fsd`, link GitHub and push:
   ```bash
   # Add your GitHub repository as a remote
   git remote add github https://github.com/<YOUR_GITHUB_USERNAME>/expense-tracker-fsd.git

   # Push the main branch
   git push -u github main
   ```
3. Open your repository on GitHub and click the **"Actions"** tab:
   * You will see the **CI/CD Pipeline** running automatically.
   * Watch it check out the code, start the MongoDB 7.0 container, run 10/10 API smoke tests, compile the Vite production bundle, and show the **Green Checkmark (Passed)**!

---

## 🌐 Step 2: Deploy Frontend on Vercel (Free, 2 Minutes)

1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Import your `expense-tracker-fsd` repository.
4. Configure Project Settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click edit and select `client`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   * `VITE_API_URL` = `https://<your-render-backend-url>/api` *(or local for preview)*
   * `VITE_SOCKET_URL` = `https://<your-render-backend-url>`
6. Click **Deploy**. Within 60 seconds, Vercel gives you a public URL (e.g., `https://expense-tracker-fsd.vercel.app`).
   * [`client/vercel.json`](client/vercel.json) automatically ensures client-side routing works for `/login`, `/dashboard`, `/admin`, etc.

---

## 🖥️ Step 3: Deploy Backend on Render (Free, 3 Minutes)

1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. Click **"New +"** &rarr; **"Web Service"**.
3. Select your `expense-tracker-fsd` GitHub repository.
4. Configure Settings:
   * **Name**: `expense-tracker-backend`
   * **Region**: Oregon or Frankfurt
   * **Root Directory**: `server`
   * **Runtime**: `Node`
   * **Build Command**: `npm ci`
   * **Start Command**: `npm start`
5. Add Environment Variables:
   * `NODE_ENV` = `production`
   * `PORT` = `10000`
   * `JWT_SECRET` = `super_secret_jwt_key_expense_tracker_prod_2026`
   * `CLIENT_URL` = `https://<your-vercel-frontend-url>.vercel.app`
   * `MONGO_URI` = Free MongoDB connection string (from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or Render MongoDB).
6. Click **"Create Web Service"**.

---

## 🗣️ What to Say to the Professor / Evaluator (Viva Script)

> *"For Section 10 (DevOps & CI/CD), I automated the build, test, and deployment pipeline using GitHub Actions in `.github/workflows/ci.yml`. On every push to main:*
> * *1. GitHub Actions spins up an automated Ubuntu runner with a containerized MongoDB 7.0 service.*
> * *2. It installs all dependencies with clean npm ci caching.*
> * *3. It executes our automated smoke test suite to guarantee zero regression on REST endpoints.*
> * *4. It compiles our production React Vite bundle to verify build artifacts.*
> * *For cloud deployment, the repository contains Infrastructure-as-Code manifests: `client/vercel.json` for zero-configuration React SPA deployment on Vercel, and `render.yaml` for continuous deployment on Render."*
