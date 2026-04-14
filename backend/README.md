# AI Assistant Backend

This backend now uses a Python ML service for command understanding and keeps the existing Node.js execution layer for safe automation.

## Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in your values.
2. Install the Node.js dependencies from the repo root:
   ```bash
   npm install
   ```
3. Install the Python dependencies for the AI service:
   ```bash
   cd backend/ai
   python -m pip install -r requirements.txt
   ```
4. Train the initial model:
   ```bash
   python train.py
   ```
5. Start the Python AI service:
   ```bash
   python app.py
   ```
6. Start the Node backend in a second terminal from the repo root:
   ```bash
   npm run dev:backend
   ```

The backend still initializes PostgreSQL tables automatically at startup.

## AI Command Flow

The active command pipeline is:

1. Node.js receives the user command.
2. Node calls the Python `/predict` API.
3. The Python service corrects spelling with RapidFuzz.
4. A scikit-learn intent model predicts the command intent.
5. Reinforcement memory in JSON adjusts future predictions.
6. Node executes the selected action.
7. Node sends the execution result back to Python through `/feedback`.

If the Python service is unavailable, the Node backend falls back to the legacy router so the app remains usable.

## Development OTP Mode (No External SMS/Email)

Use these `.env` values for local testing:

```env
DEV_OTP_MODE=true
DEV_OTP_EXPOSE_IN_API=true
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=3
```

In this mode:

- No external SMS or SMTP call is made.
- OTP APIs return `developmentOtp` so frontend can display: `Your OTP is: 123456`.
- OTP success/error and resend flow can be tested completely in UI.


## Python AI Service Files

- `backend/ai/app.py` - Flask API for prediction, feedback, and training.
- `backend/ai/train.py` - one-shot training script.
- `backend/ai/intent_model.py` - ML model, spell correction, argument extraction, and RL memory.
- `backend/ai/data/command_dataset.json` - supervised training dataset.
- `backend/ai/data/reinforcement_memory.json` - reward table and feedback log.
- `backend/ai/models/intent_model.joblib` - generated trained model artifact.

## Environment

### Backend `.env`

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

## API Modules

- `POST /api/auth/signup`
- `POST /api/auth/signup/verify-phone`
- `POST /api/auth/signup/verify-email`
- `POST /api/auth/signup/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/login/verify-otp`
- `POST /api/auth/login/resend-otp`
- `POST /api/auth/logout`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password` (sends reset OTP)
- `POST /api/auth/reset-password` (email + OTP + new password)
- `GET /api/auth/me`
- `GET /api/chat/sessions`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:sessionId`
- `POST /api/chat/message`
- `DELETE /api/chat/sessions/:sessionId`
- `GET /api/tasks/history`
- `POST /api/tasks/run`

## Supported Command Examples

- `open whatsapp installed in my pc`
- `open whatsapp on chrome`
- `play shape of you on youtube on chrome`
- `send mail hello baby to someone@example.com`
- `send whatsapp message to HR maam hello baby how are you`
- `open downloads folder`
- `play music`
- `search best ai tools`

## Learning Loop

- Successful commands are saved back into the dataset as new labeled examples.
- Failed commands update the reinforcement memory with negative reward.
- User corrections can be promoted into the training dataset automatically.
- The Python model retrains from the JSON dataset whenever positive feedback arrives.

## Node Execution Layer

- Browser automation still uses `puppeteer-core` for YouTube, Gmail, and WhatsApp Web.
- Local app and folder launches use `child_process` through a shared system command service.
- Email and WhatsApp desktop flows remain in the existing automation layer.

## Useful Scripts

- `npm run dev:backend` - start the Node API server from the repo root.
- `npm --prefix backend run ai:serve` - start the Python AI API.
- `npm --prefix backend run ai:train` - retrain the Python model once.
