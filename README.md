# ⚡ DeadlineIQ — AI-Based Smart Deadline Conflict Detection System

> An intelligent full-stack web application that predicts deadline risks, detects schedule conflicts, and optimizes your task schedule using machine learning.

🌐 **Live Demo:** [ai-deadline-conflict-detector.vercel.app](https://ai-deadline-conflict-detector.vercel.app)  
🔧 **Backend API:** [deadlineiq-backend.onrender.com/docs](https://deadlineiq-backend.onrender.com/docs)

---

##  Features

- **ML Risk Prediction** — Random Forest model predicts deadline miss probability on every task (90% accuracy, F1=0.80)
- **Conflict Detection** — Detects Deadline Overlap, Workload Overload, and Dependency Block conflicts automatically
- **AI Schedule Optimizer** — Ranks tasks by urgency score (priority × deadline × ML risk) and assigns suggested start dates
- **Daily Briefing** — Gemini AI generates a personalized morning report with focus task, priorities, and risk alerts
- **AI Assistant** — Floating chat powered by Gemini for natural language task queries
- **Kanban Board** — Drag-and-drop task management across To Do / In Progress / Done / Missed
- **Analytics** — Completion rate ring, 14-day workload chart, task status breakdown
- **Email Notifications** — Welcome email, conflict alerts, deadline reminders (8 AM), nightly reports (9 PM)
- **Admin Panel** — Role-based admin interface with system stats, user management, ML monitoring
- **Dark / Light Mode** — Persistent theme toggle across all pages

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, CSS Modules, Zustand, TanStack Query, Axios, Recharts |
| Backend | FastAPI (Python), async SQLAlchemy, Alembic migrations |
| Database | PostgreSQL (Neon hosted) |
| ML | Scikit-learn Random Forest Classifier |
| AI | Google Gemini API |
| Email | aiosmtplib (async SMTP) |
| Scheduler | APScheduler |
| Auth | JWT (python-jose) + bcrypt |
| Hosting | Render (backend) + Vercel (frontend) |

---

## 📁 Project Structure

```
deadlineiq/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py          # Register, login, profile, password
│   │   │       │   ├── tasks.py         # Task CRUD, subtasks, status updates
│   │   │       │   ├── intelligence.py  # Predictions, conflicts, recommendations, analytics
│   │   │       │   ├── admin.py         # Admin-only endpoints (role: admin JWT)
│   │   │       │   └── ai.py            # Gemini AI chat and daily briefing
│   │   │       └── router.py            # Registers all routers under /api/v1
│   │   ├── core/
│   │   │   ├── config.py                # All settings from .env (Pydantic BaseSettings)
│   │   │   └── security.py              # JWT creation, bcrypt hashing, auth dependencies
│   │   ├── db/
│   │   │   └── session.py               # Async SQLAlchemy engine + session factory
│   │   ├── ml/
│   │   │   ├── model.py                 # MLModelService singleton + feature extractor
│   │   │   └── models/
│   │   │       └── deadline_risk_model.pkl  # Trained Random Forest model
│   │   ├── models/
│   │   │   └── models.py                # SQLAlchemy ORM: User, Task, Prediction, Conflict, etc.
│   │   ├── schemas/
│   │   │   ├── auth.py                  # Pydantic schemas for auth requests/responses
│   │   │   └── tasks.py                 # Pydantic schemas for task operations
│   │   ├── services/
│   │   │   ├── user_service.py          # User CRUD operations
│   │   │   ├── task_service.py          # Task CRUD + workload calculations
│   │   │   ├── prediction_service.py    # ML inference + save to DB
│   │   │   ├── conflict_service.py      # 3-type conflict detection engine
│   │   │   ├── optimizer_service.py     # Urgency scoring + schedule generation
│   │   │   ├── email_service.py         # HTML email templates + async SMTP sender
│   │   │   └── scheduler.py            # APScheduler jobs (8AM reminders, 9PM reports)
│   │   └── main.py                      # FastAPI app, CORS, lifespan (ML load + scheduler)
│   ├── alembic/
│   │   ├── env.py                       # Alembic async migration runner
│   │   └── versions/
│   │       └── 001_initial.py           # Creates all 6 tables + enums
│   ├── tests/
│   │   ├── conftest.py                  # Pytest fixtures (async test DB, test client)
│   │   ├── test_api/
│   │   │   ├── test_auth.py             # Auth endpoint tests
│   │   │   ├── test_tasks.py            # Task CRUD tests
│   │   │   └── test_intelligence.py     # ML, conflicts, analytics tests
│   │   └── test_services/
│   │       └── test_ml.py               # ML model unit tests
│   ├── .env                             # Local environment variables (not committed)
│   ├── .env.example                     # Template for environment variables
│   ├── .python-version                  # Pins Python 3.11 for Render
│   ├── alembic.ini                      # Alembic configuration
│   ├── render.yaml                      # Render deployment config
│   └── requirements.txt                 # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx            # Login + admin detection + redirect
│   │   │   ├── RegisterPage.jsx         # User registration form
│   │   │   ├── DashboardPage.jsx        # Main dashboard with stats, workload, risk
│   │   │   ├── TasksPage.jsx            # Task list with ML risk badges + CRUD
│   │   │   ├── KanbanPage.jsx           # Drag-and-drop kanban board
│   │   │   ├── ConflictsPage.jsx        # Conflict detection + resolve
│   │   │   ├── RecommendationsPage.jsx  # AI schedule optimizer
│   │   │   ├── AnalyticsPage.jsx        # Charts: completion rate, workload, pie
│   │   │   ├── NotificationsPage.jsx    # System alerts with read/delete
│   │   │   ├── ProfilePage.jsx          # Profile + password change
│   │   │   ├── BriefingPage.jsx         # Gemini AI daily briefing
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx   # System overview stats
│   │   │       ├── AdminUsers.jsx       # User list + soft ban/unban
│   │   │       ├── AdminML.jsx          # ML prediction stats
│   │   │       ├── AdminConflicts.jsx   # System-wide conflict overview
│   │   │       └── AdminActivity.jsx    # Recent registrations + 24h spikes
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.jsx        # User sidebar + nav + theme toggle
│   │   │   │   └── AdminLayout.jsx      # Admin sidebar (red accent) + nav
│   │   │   └── ui/
│   │   │       └── AIAssistant.jsx      # Floating Gemini chat widget
│   │   ├── services/
│   │   │   └── api.js                   # Axios instances + all API calls + auto token refresh
│   │   ├── store/
│   │   │   ├── authStore.js             # User auth state (Zustand)
│   │   │   ├── adminAuthStore.js        # Admin auth state (separate token)
│   │   │   └── themeStore.js            # Dark/light theme (persisted to localStorage)
│   │   ├── App.jsx                      # Routes: user routes + admin routes + guards
│   │   ├── index.css                    # Global CSS variables, dark/light themes, utilities
│   │   └── main.jsx                     # React entry point
│   ├── .env.production                  # VITE_API_URL for production build
│   ├── vercel.json                      # Vercel SPA rewrite rules
│   ├── vite.config.js                   # Vite config + dev proxy to backend
│   └── package.json                     # Frontend dependencies
│
├── README.md
├── PRESENTATION_SCRIPT.md               # Demo script and feature explanations
└── .gitignore
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local) or Neon (cloud)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment file and fill in values
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend `.env`

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/deadline_db

# JWT
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ML Model
ML_MODEL_PATH=app/ml/models/deadline_risk_model.pkl
ML_MODEL_VERSION=rf_v1.0

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Admin (no DB — env only)
ADMIN_EMAIL=admin@deadlineiq.com
ADMIN_PASSWORD=YourAdminPassword

# Email (Gmail App Password)
EMAILS_ENABLED=True
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password

# CORS
CORS_ORIGINS=http://localhost:5173
```

### Frontend `.env.production`

```env
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

---

## 🤖 ML Model Details

| Property | Value |
|---|---|
| Algorithm | Random Forest Classifier |
| Accuracy | 90% |
| F1 Score | 0.80 |
| Training samples | 5000 tasks |
| Features | 15 engineered features |
| Output | HIGH / LOW risk + probability score (0–1) |

**Features used:** `time_remaining`, `estimated_hours`, `priority`, `daily_available_hours`, `workload_that_day`, `past_delay_rate`, `effort_gap`, `hours_per_day_needed`, `buffer_ratio`, `is_overloaded`, `time_pressure`, `overload_ratio`, `risk_index`, `user_type`, `dependency_count`

---

## 📧 Email System

| Email | Trigger | Time |
|---|---|---|
| Welcome | On registration | Immediate |
| Conflict Alert | When conflicts detected | Immediate |
| Deadline Reminder | Tasks due tomorrow | Daily 8 AM UTC |
| Nightly Report | Full stats summary | Daily 9 PM UTC |

---

## 🗄️ Database Schema

6 tables in PostgreSQL:

| Table | Purpose |
|---|---|
| `users` | Account info, daily hours, completion rate |
| `tasks` | Task data with self-referencing subtask support |
| `predictions` | ML predictions with full feature snapshot |
| `conflicts` | Detected conflicts with affected task IDs |
| `schedule_recommendations` | AI-generated schedules with accept/reject |
| `notifications` | System alerts (risk, conflict, reminder, system) |

---

## 👤 Admin Panel

Login with admin credentials on the same `/login` page → auto-redirected to `/admin/dashboard`

Admin can view (no private task content exposed):
- System-wide user and task counts
- ML prediction stats and risk breakdown
- Conflict counts by type and severity
- Recent registrations and activity spikes
- Soft ban / unban users

---

## 🧪 Tests

```bash
cd backend
pytest --cov=app tests/
```

37 tests passing — covers auth, tasks, ML inference, conflict detection, analytics, and intelligence endpoints.

---

## 🚀 Deployment

| Service | Platform | URL |
|---|---|---|
| Backend | Render | `https://deadlineiq-backend.onrender.com` |
| Frontend | Vercel | `https://ai-deadline-conflict-detector.vercel.app` |
| Database | Neon PostgreSQL | US East (N. Virginia) |

---

## 👥 Team

| Member | Contribution |
|---|---|
| Aarmee | ML Risk Prediction, AI Schedule Optimizer, Daily Briefing, Admin Panel |
| Mardav | Authentication, Profile, Email System |
| Richa | Dashboard, Tasks, Kanban, Dark/Light Mode |
| Aryamik | Conflict Detection, Notifications, Analytics |
| Imraan | Database, API Integration, Backend Architecture |

---

## 📄 License

MIT License — see [LICENSE](LICENSE)
