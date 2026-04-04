# Dyslexia Learning System

Full-stack learning and screening platform: **React (Vite) frontend**, **Node.js + Express + MongoDB Atlas API**, and an optional **Flask** app for the original Jinja templates and sklearn screening model.

## Repository layout

| Path | Purpose |
|------|--------|
| `frontend/` | Production UI for Vercel: JWT auth, dashboard, modules, quiz, screening, games, tools (TTS + speech), admin |
| `server/` | REST API: register, login, user data, progress, quiz scores, screening (`/api/predict`), admin |
| `app.py` | Legacy Flask app (templates, SQLite/MySQL, `/api/predict` with `ml_model/dyslexia_model.pkl`) |

Cloud data (users, progress, quiz scores, saved assessments) lives in **MongoDB** via the Node API.

## API (Node)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create user (bcrypt password hash); optional admin if email matches `ADMIN_EMAIL` |
| POST | `/login` | — | Returns JWT |
| GET | `/user-data` | Bearer | Profile + progress + quiz scores + assessments |
| POST | `/progress` | Bearer | Upsert `{ moduleId, percentComplete?, meta? }` |
| GET | `/progress` | Bearer | List progress documents |
| POST | `/quiz-score` | Bearer | Save score; updates adaptive `difficultyLevel` |
| GET | `/quiz-scores` | Bearer | List quiz attempts |
| POST | `/api/predict` | Optional Bearer | Screening; saves assessment if token present |
| GET | `/admin/users` | Admin JWT | Users + activity counts |
| GET | `/admin/user/:id/progress` | Admin JWT | User progress + quizzes |

Passwords are hashed with **bcrypt** (via `bcryptjs`). Auth uses **JWT**.

### Screening model

- If `FLASK_ML_URL` is set (e.g. your Flask base URL), `POST /api/predict` proxies to Flask for the real **RandomForest** model.
- Otherwise the API uses a **local banded heuristic** (same suggestion text style as Flask) so screening works without Python on the host.

### Environment variables (`server/.env`)

Copy `server/.env.example` to `server/.env` and set:

- `MONGODB_URI` — MongoDB Atlas connection string  
- `JWT_SECRET` — long random string  
- `FRONTEND_URL` — e.g. `http://localhost:5173` or your Vercel URL (comma-separated for multiple origins)  
- Optional: `FLASK_ML_URL`, `ADMIN_EMAIL`

## Frontend (`frontend/`)

- `VITE_API_URL` — API base URL with **no** trailing slash (empty in local dev: Vite proxies to `http://localhost:4000`).
- See `frontend/.env.example`.

### Run locally (full stack)

1. **MongoDB Atlas**: create a cluster, database user, network access (`0.0.0.0/0` for testing), get connection string.
2. **API** (terminal 1):

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI, JWT_SECRET, FRONTEND_URL=http://localhost:5173
npm install
npm start
```

3. **Frontend** (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Register a user; data is stored in Atlas.

### Flask (optional, legacy UI + real ML)

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
set FLASK_APP=app.py
set DATABASE_URL=sqlite:///dyslexia.db
python app.py
```

To use Flask’s `/api/predict` from the Node API, run Flask (e.g. port 5000) and set `FLASK_ML_URL=http://localhost:5000` in `server/.env`.

## Deploy

### Frontend — Vercel

**If you see `FUNCTION_INVOCATION_FAILED` or “Serverless Function has crashed”:** the project was still routing traffic to **Python/Flask** (`app.py`). The repo root `vercel.json` now builds **only** the Vite app via `@vercel/static-build` (no serverless page handler). Redeploy after pulling the latest `main`.

1. Import the GitHub repo (or reconnect).
2. **Recommended:** Vercel → Project → Settings → General → **Root Directory** = `frontend`, Framework = **Vite**, Output = **`dist`**. Then `app.py` is not part of the deployment and cannot be invoked as a function.
3. **Alternative:** Leave root as `.` and rely on the root `vercel.json` `builds` entry for `frontend/package.json` (static build only).
4. Environment variable: `VITE_API_URL` = `https://your-api.onrender.com` (no trailing slash). Redeploy after changing env vars.
5. In Vercel → Settings → General, clear any **custom** “Build Command” / “Output” that still point at Python or `app.py`.

### Backend — Render (example)

1. New **Web Service**, connect the repo.
2. **Root Directory**: `server`
3. **Build**: `npm ci`  
4. **Start**: `npm start`
5. Set `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (your Vercel URL, e.g. `https://dyslexia-learning-system.vercel.app`).

`render.yaml` in the repo is a starting blueprint; you can still tune settings in the Render UI.

### CORS

`FRONTEND_URL` must match the browser origin of your SPA (scheme + host, no path). Multiple origins: comma-separated list in `FRONTEND_URL`.

## Admin

Set `ADMIN_EMAIL` on the server to your admin’s email (lowercase). The **first** registered user with that email receives `role: "admin"` and can open `/admin` in the SPA.

## ML model (Flask)

- File: `ml_model/dyslexia_model.pkl`
- Trainer: `train_model.py`
- Input: up to 12 binary answers; output: class 0 / 1 / 2

## Fixes applied in this repo

- `templates/assessment.html`: removed stray `p` before `{% extends %}` and corrected `questions | tojson` (was broken JSON in the script block).

## License / attribution

© 2026 Dyslexia Learning System. Adjust license as needed for your organization.
