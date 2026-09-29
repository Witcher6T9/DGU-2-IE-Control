# Remix DGU-2 IE Control (Witcher6T9/DGU-2-IE-Control)

[![CI/CD Pipeline](https://github.com/Witcher6T9/DGU-2-IE-Control/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Witcher6T9/DGU-2-IE-Control/actions/workflows/ci-cd.yml)
[![Security Scan](https://github.com/Witcher6T9/DGU-2-IE-Control/actions/workflows/security-scan.yml/badge.svg)](https://github.com/Witcher6T9/DGU-2-IE-Control/actions/workflows/security-scan.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node: 22+](https://img.shields.io/badge/Node-v22+-green.svg)](https://nodejs.org)

Continuous Industrial Engineering (IE) Daily Control, Sewing Line Balancing, and Floor Operations Platform for DGU-2.

---

## 🚀 Automated CI/CD Pipeline Architecture

The repository **`Witcher6T9/DGU-2-IE-Control`** includes an enterprise-grade Continuous Integration and Continuous Deployment (CI/CD) pipeline built with GitHub Actions (`.github/workflows/ci-cd.yml`). Every commit automatically triggers the full build, test, and deployment sequence:

```
[ Git Push / PR ] 
       │
       ▼
 ┌────────────────────────────────────────────────────────┐
 │ 1. Code Quality & Type Check                           │
 │    - Node.js 22.x environment setup                    │
 │    - Dependency caching (npm cache)                    │
 │    - TypeScript static analysis (tsc --noEmit)         │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. Automated Unit Tests                                │
 │    - 8-Hour Line Balancing calculations                │
 │    - Factory metrics & Line OEE formulas               │
 │    - Auto-Refresh & Offline Sync engine verification   │
 │    - Date & Calendar utilities (Weekly Friday Holiday) │
 └─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. Production Build & PWA Packaging                    │
 │    - Vite production bundle optimization               │
 │    - Workbox Service Worker generation                 │
 │    - Asset manifest & integrity verification           │
 │    - Upload build artifact (dist/)                     │
 └─────────────────────────┬──────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
 ┌───────────────────────────┐ ┌───────────────────────────┐
 │ 4. Continuous Deployment: │ │ 5. Continuous Deployment: │
 │    GitHub Pages           │ │    Firebase Hosting       │
 │    - Live preview on push │ │    - Deploys hosting dist │
 │      to main / master     │ │    - Deploys rules:       │
 │    - Zero third-party auth│ │      firestore.rules      │
 └───────────────────────────┘ └───────────────────────────┘
```

---

## 🛠️ Pipeline Stages & Workflow Features

| Stage | Script / Action | Purpose |
|---|---|---|
| **Lint & Type Check** | `npm run lint` (`tsc --noEmit`) | Strict TypeScript validation without emitting files. |
| **Unit Testing** | `npm test:ci` (`tsx --test ...`) | Fast, native Node 22 test runner verifying IE math and logic. |
| **Production Build** | `npm run build` (`vite build`) | Produces optimized chunks, PWA service worker, and assets. |
| **Build Verification** | Shell assertions | Checks that `dist/index.html` and `dist/manifest.webmanifest` exist. |
| **GitHub Pages CD** | `actions/deploy-pages@v4` | Automated deployment to GitHub Pages for instant web preview. |
| **Firebase CD** | `firebase-tools deploy` | Deploys static build to Firebase Hosting and updates `firestore.rules`. |
| **Security Audit** | `.github/workflows/security-scan.yml` | Scans dependencies via `npm audit` and checks for leaked secrets. |
| **Dependabot** | `.github/dependabot.yml` | Weekly automated dependency version and security bump PRs. |

---

## ⚙️ Repository Secrets Configuration

To enable the automated deployment targets on `Witcher6T9/DGU-2-IE-Control`:

1. Navigate to **GitHub Repository Settings** > **Secrets and variables** > **Actions**
2. Add the following secrets if you want to enable their specific deployment targets:

| Secret Name | Required For | Description |
|---|---|---|
| `FIREBASE_TOKEN` | Firebase Hosting / Rules | Generated via `npx firebase login:ci` |
| `GEMINI_API_KEY` | Server AI Assistant | Optional Gemini API key for server features |

### Enabling GitHub Pages in GitHub:
1. In repository settings, navigate to **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. On every push to `main` or `master`, your live app will be deployed at:
   `https://witcher6t9.github.io/DGU-2-IE-Control/`

---

## 💻 Local Development & Testing

```bash
# 1. Clone repository
git clone https://github.com/Witcher6T9/DGU-2-IE-Control.git
cd DGU-2-IE-Control

# 2. Install dependencies
npm install

# 3. Run type check
npm run lint

# 4. Run automated test suite
npm test

# 5. Run development server (Vite + Express)
npm run dev

# 6. Production build
npm run build
```

---

## 🐳 Docker & Container Deployment

A multi-stage, production-hardened `Dockerfile` is included for container platforms (Google Cloud Run, AWS ECS, Docker Swarm, or Kubernetes):

```bash
# Build Docker image
docker build -t witcher6t9/dgu-2-ie-control:latest .

# Run Docker container locally
docker run -p 3000:3000 witcher6t9/dgu-2-ie-control:latest
```

The container includes:
- Non-root user execution (`USER node`)
- Built-in HTTP health check at `/api/health`
- Minimal Alpine Node 22 runtime
