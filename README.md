# Geomaticx Management System - React + Express + MySQL

A database-driven operational platform for Geomaticx. Business records are created through the application and dashboard figures are calculated from MySQL.

## Current implementation

### Organization and access foundation

- JWT login, password hashing and role-based navigation/API permissions
- Administrator user creation, editing, role assignment and activation/deactivation
- Self-deactivation protection for administrators
- Office/branch, department and designation masters
- Employee master linked to office, department, designation and user account
- Employee reporting hierarchy
- Audit trail for create, update, delete, activate and deactivate actions

### Operations MVP

- Client, project and task records
- Role-aware task assignment and progress tracking with in-app notifications
- Attendance check-in/check-out with optional coordinates
- Dynamic survey-form builder with JSON field definitions
- Survey submissions linked to forms, projects and users
- Live dashboard totals
- Search-ready REST endpoints and UUID-based database relationships
- MySQL 8, Sequelize, Docker Compose, health checks and production web proxy

### Governed AI inference

- Server-side OpenAI Responses API integration; provider credentials are never exposed to the browser
- Prompt classification and pre-flight blocking for restricted or personal data
- Immutable SHA-256 prompt lineage, model/provider response ID, token usage and latency evidence
- Human review queue with maker-checker approval before an output can be released
- Audit events for requests, provider completion/failure and approval decisions

Set `OPENAI_API_KEY` in `.env` to enable inference. `OPENAI_MODEL` defaults to `gpt-5.6-sol` and can be changed without rebuilding the application. Keep `AI_ALLOW_SELF_APPROVAL=false` in production so the requester cannot approve their own output.

## Quick start with Docker

1. Copy `.env.example` to `.env` and change every password and secret.
2. Run `docker compose up --build`.
3. Open `http://localhost:8080`.
4. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
5. Create named user accounts and replace the bootstrap password.

The API creates missing tables and the first administrator only. It does not insert sample business data.

## Local development

Requirements: Node.js 20+, npm and MySQL 8.

```bash
docker compose up -d mysql
npm install
npm run install:all
npm run dev
```

Web: `http://localhost:5173`  
API: `http://localhost:4000/api`

## Verification

```bash
npm test
```

This runs backend model/runtime tests and a production frontend build.

## API summary

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- CRUD: `/api/offices`, `/api/departments`, `/api/designations`, `/api/employees`
- `GET/POST/PUT /api/users`, `PATCH /api/users/:id/status`
- CRUD: `/api/clients`, `/api/projects`, `/api/tasks`, `/api/survey-forms`
- Notifications: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- `GET/POST /api/attendance`, `PATCH /api/attendance/:id/checkout`
- `GET/POST /api/survey-submissions`
- `GET /api/audit-logs` (administrator)
- `GET /api/ai/status`, `GET/POST /api/ai/inferences`
- `PATCH /api/ai/inferences/:id/review`, `GET /api/ai/inferences/:id/output`
- `GET /api/health`

Send `Authorization: Bearer <token>` on protected requests.

## Development roadmap

1. Complete Step 1 with company profile, explicit permission policies and reviewed database migrations.
2. Expand Step 2 with leave requests/approvals, movement and field duty, timesheets, daily diaries, documents, skills and training.
3. Expand Step 3 with project teams, stages, milestones, dependencies, risks, issues, deliverables and closure.
4. Expand Step 4 with subtasks, evidence, comments, escalation, reassignment, supervisor review and activity history.
5. Add field mobile workflows, offline synchronization, media/object storage and GIS map collection.
6. Add equipment, logistics, commercial, billing, quality, analytics and AI-assisted processing modules.

## Production requirements

- Store secrets outside source control and rotate the bootstrap credentials.
- Put the service behind HTTPS, a firewall and a controlled reverse proxy.
- Replace automatic `sequelize.sync()` with reviewed migrations before production rollout.
- Add object storage for photographs, documents, LiDAR, drone and GIS files.
- Configure database/object backups and test restoration.
- Add automated API authorization, workflow and integration tests before go-live.
