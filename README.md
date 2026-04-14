# AI Assistant Web Application

This repository contains a full-stack assistant with:

- Email/password authentication
- Google OAuth login
- OTP login via email and verification during signup
- Forgot password + OTP-based reset and reset link flow
- Chat dashboard with saved conversation history
- Agent mode for command interpretation and task execution
- Manual task runner panel for commands
- Voice input using the Web Speech API
- OpenAI chat/command understanding
- Python ML-based command understanding with feedback learning
- PostgreSQL persistence

## Stack

- Frontend: React, TailwindCSS, Vite
- Backend: Node.js, Express
- AI service: Python, Flask, scikit-learn, RapidFuzz
- Database: PostgreSQL (`pg` driver)
- Auth: JWT in HTTP-only cookies + Google ID token verification

## Folder Structure

```text
/
  src/
    components/
    context/
    hooks/
    lib/
    pages/
    App.jsx
    main.jsx
    index.css
  backend/
    src/
      config/
      controllers/
      middleware/
      repositories/
      routes/
      services/
      utils/
      app.js
      server.js
    ai/
      app.py
      train.py
      intent_model.py
      data/
      models/
    .env.example
    package.json
  .env.example
  package.json
  tailwind.config.js
  postcss.config.js
```

## Environment

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
```

Backend `backend/.env`:

```env
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
WHATSAPP_CONTACTS_JSON={"hr maam":"919876543210"}

AGENT_ARTIFACTS_DIR=./artifacts
CHROME_EXECUTABLE_PATH=

AI_SERVICE_URL=http://127.0.0.1:5100
AI_SERVICE_TIMEOUT_MS=8000
AI_SERVICE_HOST=127.0.0.1
AI_SERVICE_PORT=5100
AI_DATASET_PATH=./ai/data/command_dataset.json
AI_MEMORY_PATH=./ai/data/reinforcement_memory.json
AI_MODEL_PATH=./ai/models/intent_model.joblib
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

Python AI service:

```bash
cd backend/ai
python -m pip install -r requirements.txt
python train.py
python app.py
```

The backend auto-creates required PostgreSQL tables at startup.

If Node is not installed, install it first:

- Windows: https://nodejs.org/
- Verify: `node -v` and `npm -v`

## Command Learning

The command agent now uses the Python service for prediction and feedback:

1. The Node backend sends the user command to `/predict`.
2. The Python service applies RapidFuzz spell correction.
3. A scikit-learn model predicts intent.
4. Reinforcement memory updates from `/feedback`.
5. The Node backend executes the selected action.

If the Python service is unreachable, the backend falls back to the legacy router so the app remains usable.
