# AI Assistant Web Application

This repository contains a full-stack AI assistant app with:

- Email/password authentication
- Google OAuth login
- OTP verification during signup
- Forgot password + OTP-based reset
- ChatGPT-style dashboard with saved conversation history
- Agent Mode for automatic command interpretation + task execution
- Task Runner panel with manual command execution
- Voice input using Web Speech API
- OpenAI integration for chat/command understanding
- PostgreSQL persistence

## Stack

- Frontend: React (JavaScript), TailwindCSS, Vite
- Backend: Node.js, Express
- Database: PostgreSQL (`pg` driver)
- Auth: JWT in HTTP-only cookies + Google ID token verification

## Project Structure

```text
/
├─ src/
│  ├─ components/
│  │  ├─ auth/
│  │  ├─ chat/
│  │  ├─ layout/
│  │  ├─ tasks/
│  │  └─ ProtectedRoute.jsx
│  ├─ context/AuthContext.jsx
│  ├─ hooks/useSpeechRecognition.js
│  ├─ lib/api.js
│  ├─ pages/
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  │  ├─ db.js
│  │  │  └─ env.js
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ utils/
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ .env.example
│  └─ package.json
├─ .env.example
├─ package.json
├─ tailwind.config.js
└─ postcss.config.js
```

## Environment

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
```

### Backend `backend/.env`

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ai_agent
DATABASE_SSL=false
CLIENT_URL=http://localhost:5173

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRY=7d

OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
GOOGLE_CLIENT_ID=

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@ai-agent.local

AGENT_ARTIFACTS_DIR=./artifacts
```

Gemini via OpenAI-compatible API:

```env
OPENAI_API_KEY=AIza...
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.0-flash
```

## Run

Prerequisites:

- Node.js 20+ and npm
- PostgreSQL 14+ running locally
- Google Chrome (required for browser automation commands)

Setup:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

The backend auto-creates required PostgreSQL tables at startup.

If Node is not installed, install it first:

- Windows: https://nodejs.org/
- Verify: `node -v` and `npm -v`
