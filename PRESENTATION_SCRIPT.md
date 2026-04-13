# DeadlineIQ — Feature Explanation Script
## AI-Based Smart Deadline Conflict Detection System

---

## PROBLEM STATEMENT

In today's fast-paced academic and professional environment, people manage multiple tasks simultaneously — assignments, projects, meetings, and personal work — all with different deadlines and effort requirements. The core problem is that humans are not good at predicting which tasks will cause them to fail their deadlines before it actually happens.

Most people realize they are overloaded only when it is too late — when two major tasks are due on the same day, when a week is packed beyond capacity, or when a subtask is scheduled after its parent task should already be done. Traditional to-do apps like Notion, Trello, or Google Tasks only let you list and organize tasks. They do not warn you about conflicts, they do not predict risk, and they do not tell you what to work on first.

The specific problems we identified:
- No early warning when a deadline is at risk of being missed
- No detection of scheduling conflicts across multiple tasks
- No intelligent prioritization — users manually decide what to work on
- No awareness of workload capacity — users keep adding tasks without knowing they are already overloaded
- No personalized daily guidance on what to focus on

**Our solution — DeadlineIQ** — is an AI-powered web application that solves all of these. It uses a machine learning model to predict deadline risk on every task, a rule-based conflict detection engine to find scheduling problems before they happen, an AI schedule optimizer to tell you exactly what to work on and when, and a Gemini-powered daily briefing to give you a personalized morning report. The goal is to move from reactive task management to proactive deadline intelligence.

---

## WHAT IS DeadlineIQ — OVERALL PURPOSE

DeadlineIQ is a full-stack web application for smart deadline and workload management. It is designed for students, professionals, and teams who manage multiple tasks with deadlines and need AI assistance to stay on track.

The website works like this — you create your tasks with deadlines and effort estimates, and the system does the intelligence work for you. It predicts which tasks are risky, detects conflicts in your schedule, suggests the optimal order to work on things, sends you reminders and reports by email, and gives you a daily AI briefing every morning. There is also an admin panel for system monitoring.

The tech stack is FastAPI on the backend with PostgreSQL database, React on the frontend, a scikit-learn Random Forest ML model for predictions, Google Gemini for the AI briefing, and APScheduler for automated email jobs.

---

## 1. REGISTER & LOGIN

When you open DeadlineIQ, you land on the login page. New users can register by entering their name, email, password, and daily available hours. The password must have at least 8 characters, one uppercase letter, and one digit for security.

On the backend, the password is hashed using bcrypt with SHA-256 pre-hashing — bcrypt has a 72-byte limit so we compress longer passwords with SHA-256 first before hashing. This is a production-safe approach.

When you log in, the system returns two tokens — an access token valid for 60 minutes and a refresh token valid for 7 days. The frontend automatically refreshes the access token silently when it expires, so you never get logged out unexpectedly.

The same login page handles both regular users and admins. If the credentials match the admin credentials stored in the environment file, you get redirected to the admin panel with a special JWT that has a role: admin claim.

---

## 2. DASHBOARD

The dashboard is the first thing you see after logging in. It gives you a complete picture of your workload in one screen.

At the top are four stat cards — active tasks count, active conflicts count, tasks due this week, and unread alerts. These update every 60 seconds automatically.

Below that is a workload capacity bar. It calculates total effort hours of all your active tasks divided by your weekly available hours and shows it as a percentage. Green means healthy, yellow means busy, red means overloaded with a warning message.

Next to it is a risk breakdown showing how many of your tasks are HIGH, MEDIUM, and LOW risk based on ML predictions — displayed as horizontal bars.

The bottom section shows your 5 most recent tasks with their priority and risk badges, and your active conflicts with their severity.

---

## 3. TASKS PAGE

The tasks page is where you manage all your work. You can create a task by clicking New Task and filling in the title, description, deadline, estimated effort hours, priority level (LOW / MEDIUM / HIGH / CRITICAL), and category.

The moment you create a task, the ML model runs automatically in the background and attaches a risk prediction to it. If the risk is HIGH, you immediately get a red warning notification. Each task card shows the priority badge, risk badge, task status, deadline, effort hours, and a probability bar at the bottom showing the exact percentage chance of missing the deadline.

You can filter tasks by status and priority, search by title, start a task (moves it to IN PROGRESS), complete it, edit it, or delete it.

---

## 4. KANBAN BOARD

The Kanban board solves a specific problem — sometimes you don't want to look at a list of tasks, you want to see the big picture of where everything stands at a glance.

Kanban is a visual project management method originally from Toyota's manufacturing process. The idea is simple — tasks move through stages from left to right as they progress. In DeadlineIQ, the four stages are To Do, In Progress, Done, and Missed.

The practical use is this — instead of opening each task individually to check its status, you open the Kanban board and instantly see how many tasks are in each stage, which ones are overdue, which ones are high risk, and how your work is distributed. If you see too many cards in "To Do" and nothing in "In Progress", you know you haven't started enough. If you see cards in "Missed", you know you need to address those.

You can drag any task card from one column to another to update its status. The backend updates immediately. Each card shows the priority, risk level, effort hours, and days remaining until deadline. Cards with HIGH risk have a colored top border so they stand out. If a task is overdue, it shows "Overdue" in red instead of days remaining.

---

## 5. ML RISK PREDICTION

This is the core AI feature of the system. Every task gets a deadline risk prediction automatically using a Random Forest Classifier trained on 5000 task samples. The model achieves 90% accuracy with an F1 score of 0.80.

The model uses 15 engineered features:
- Time remaining until deadline
- Estimated effort hours
- Task priority
- User's daily available hours
- Current workload that day
- Past delay rate (how often this user misses deadlines)
- Effort gap, hours per day needed, buffer ratio
- Is overloaded flag, time pressure, overload ratio
- A composite risk index combining all three

The output is HIGH or LOW risk with a probability score between 0 and 1. This score appears as a badge on every task card and feeds into the schedule optimizer.

---

## 6. CONFLICT DETECTION

The conflict detection engine analyzes all your active tasks and detects three types of scheduling problems.

**Deadline Overlap** — when multiple tasks share the same deadline and their combined effort hours exceed 60% of your available time for that period. If it exceeds 100% it becomes CRITICAL severity.

**Workload Overload** — using a sliding 7-day window, the engine checks if total effort in any week exceeds your weekly capacity. It checks 4 windows — current week and the next 3 weeks ahead.

**Dependency Block** — when a subtask has a later deadline than its parent task, which is logically impossible to complete in the right order.

Each detected conflict shows the type, severity (WARNING or CRITICAL), a plain English description of exactly what the problem is, how many tasks are affected, and a button to mark it resolved. When conflicts are found, a notification is automatically created and an email alert is sent to the user.

---

## 7. AI SCHEDULE OPTIMIZER

The schedule optimizer on the AI Schedule page ranks all your active tasks by an urgency score using this formula:

**Urgency = (Priority Weight × 0.40) + (1 / Days Remaining × 0.35) + (ML Risk Probability × 0.25)**

So a CRITICAL priority task due tomorrow with HIGH risk will score much higher than a LOW priority task due next month with LOW risk.

After ranking, it greedily assigns suggested start dates based on your daily available hours — filling your days in urgency order. The result is a numbered list of tasks with suggested start dates, urgency scores, and risk levels. You can accept the schedule (saves it to history) or reject it and generate a new one.

---

## 8. DAILY BRIEFING (AI)

The Daily Briefing page uses Google Gemini AI. When you click Generate Briefing, the backend fetches all your tasks from the database, calculates your current risk patterns and conflict status, and sends everything to Gemini. Gemini then generates a personalized morning report in natural language.

The briefing includes:
- A personalized greeting
- Your focus task for today
- Top 3 priorities
- A suggested schedule for the day
- Risk alerts if any tasks are HIGH risk
- Conflict alerts if unresolved conflicts exist
- A productivity tip
- A motivational quote

If Gemini is unavailable, the page falls back to a static template so it never breaks.

---

## 9. ANALYTICS

The analytics page shows your productivity insights over time.

There is a completion rate ring chart showing what percentage of your tasks you complete on time — green if above 70%, yellow if above 40%, red if below. Stat pills show total completed, missed, pending, and total tasks. A pie chart shows the task status mix visually. And a 14-day workload vs capacity bar chart shows your effort hours against your daily capacity day by day — overloaded days are clearly visible as bars exceeding the capacity line.

You can switch between weekly, monthly, and all-time views.

---

## 10. NOTIFICATIONS

The notifications page shows all system alerts. There are four types — Risk Alert (when a task is predicted HIGH risk), Conflict Detected (when conflicts are found), Deadline Reminder (when a task is due soon), and System messages.

Unread notifications show a blue dot. You can click any notification to mark it read, or use Mark All Read to clear everything at once. The sidebar shows a live badge count of unread notifications that refreshes every 30 seconds. You can also delete individual notifications.

---

## 11. PROFILE PAGE

The profile page has two tabs.

The Profile tab lets you update your name and daily available hours. The daily hours setting is the most important setting in the app — it directly feeds into the ML model as a feature, determines the workload capacity bar on the dashboard, sets the threshold for conflict detection, and controls how the schedule optimizer assigns start dates.

The Security tab lets you change your password with current password verification.

---

## 12. EMAIL NOTIFICATION SYSTEM

The system sends four types of automated emails.

**Welcome Email** — sent immediately when you register. HTML formatted with the app's design, introducing all key features with a link to the dashboard.

**Conflict Alert Email** — sent automatically whenever the conflict detection engine finds new conflicts. Tells you how many conflicts were found and how many are critical, with a link to the conflicts page.

**Deadline Reminder** — sent every morning at 8 AM to users who have tasks due the next day. Lists each task with its ML risk level so you know which ones need the most attention.

**Nightly Report** — sent every evening at 9 PM with a full summary — active task count, high risk count, unresolved conflicts, tasks due this week, and workload score.

All emails are fire-and-forget — if sending fails it logs the error but never crashes the API.

---

## 13. DARK / LIGHT MODE

The theme toggle is in the sidebar footer. It switches between dark and light mode instantly across every single page — dashboard, tasks, kanban, admin panel, everything — with one click.

The preference is saved in localStorage so it persists when you refresh or come back later. Technically, the entire color system uses CSS variables, so switching themes is just changing one attribute on the HTML element. Zero component re-renders needed, zero code changes in any page.

---

## 14. ADMIN PANEL

The admin panel is a completely separate interface with its own sidebar, layout, and red-accented design to visually distinguish it from the user app.

Admin credentials are stored in environment variables only — no database table. When admin logs in through the same login page, they get a JWT with a role: admin claim. Every admin endpoint verifies this claim — regular user tokens are rejected with 403 Forbidden.

**Admin Overview** — system-wide stats: total users (active vs inactive), total tasks by status (Pending / In Progress / Completed / Missed), total predictions run, total conflicts detected.

**User Management** — list of all registered users with name, email, join date, task count, daily hours, completion rate, and account status. Admins can soft-ban or reactivate any user with one click — no data is deleted.

**ML Stats** — total predictions run, HIGH vs LOW risk breakdown with percentages, average probability score across all predictions, number of currently active HIGH risk tasks, and the model version loaded.

**Conflict Overview** — total unresolved conflicts system-wide, breakdown by type (Deadline Overlap / Workload Overload / Dependency Block), breakdown by severity (Critical / Warning), and which users have the most unresolved conflicts.

**Activity Feed** — recent user registrations in the last 7 days, HIGH risk prediction count in the last 24 hours, and critical conflict count in the last 24 hours.

Importantly, the admin cannot see any task titles, descriptions, conflict details, or prediction feature data — only counts and statistics. This is a deliberate privacy decision.

---

## DEMO FLOW (Recommended order)

1. Register a new user → check email inbox for welcome mail
2. Log in → show dashboard with stats
3. Create a task → show risk badge appearing → show probability bar
4. Go to Kanban → drag a task to In Progress
5. Go to Conflicts → run detection → show detected conflicts
6. Go to AI Schedule → generate → show urgency-ordered list
7. Go to Daily Briefing → generate → show AI report
8. Go to Analytics → show charts
9. Go to Notifications → show alerts
10. Toggle dark/light mode
11. Log out → log in as admin → show admin dashboard → show user management → show ML stats

---

## Key Numbers to Remember

- ML Model: Random Forest · 90% accuracy · F1 = 0.80 · 15 features · 5000 training samples
- Conflict types: 3 (Deadline Overlap, Workload Overload, Dependency Block)
- Email types: 4 (Welcome, Conflict Alert, Deadline Reminder, Nightly Report)
- Scheduler: Deadline reminders at 8 AM · Nightly reports at 9 PM
- JWT: Access token 60 min · Refresh token 7 days
- Database tables: 6 (users, tasks, predictions, conflicts, schedule_recommendations, notifications)
- Tests: 37 passing
