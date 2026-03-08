# AI Assistant Web Application

This repository now contains a full-stack AI assistant application with:

- Email/password authentication
- Google OAuth login (ID token flow)
- OTP login via email
- Forgot password with reset link
- ChatGPT-style dashboard with:
  - Sidebar conversations
  - Chat interface with history
  - Agent Mode toggle
  - Task Runner panel
  - Voice command input (Web Speech API)
- Node.js + Express backend
- MongoDB persistence
- OpenAI-based command understanding

## Folder Structure

```text
/
├─ src/                            # React frontend (JavaScript + Tailwind)
│  ├─ components/
│  │  ├─ auth/
│  │  │  ├─ AuthCard.jsx
│  │  │  └─ AuthLayout.jsx
│  │  ├─ chat/
│  │  │  ├─ ChatWindow.jsx
│  │  │  └─ MessageBubble.jsx
│  │  ├─ layout/
│  │  │  └─ Sidebar.jsx
│  │  ├─ tasks/
│  │  │  └─ TaskPanel.jsx
│  │  └─ ProtectedRoute.jsx
│  ├─ context/
│  │  └─ AuthContext.jsx
│  ├─ hooks/
│  │  └─ useSpeechRecognition.js
│  ├─ lib/
│  │  └─ api.js
│  ├─ pages/
│  │  ├─ DashboardPage.jsx
│  │  ├─ LoginPage.jsx
│  │  ├─ SignupPage.jsx
│  │  ├─ OtpLoginPage.jsx
│  │  ├─ ForgotPasswordPage.jsx
│  │  └─ ResetPasswordPage.jsx
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ backend/                        # Express backend
│  ├─ src/
│  │  ├─ config/
│  │  │  ├─ db.js
│  │  │  └─ env.js
│  │  ├─ controllers/
│  │  │  ├─ auth.controller.js
│  │  │  ├─ chat.controller.js
│  │  │  └─ task.controller.js
│  │  ├─ middleware/
│  │  │  ├─ auth.js
│  │  │  ├─ errorHandler.js
│  │  │  └─ validate.js
│  │  ├─ models/
│  │  │  ├─ User.js
│  │  │  ├─ ChatSession.js
│  │  │  └─ TaskLog.js
│  │  ├─ routes/
│  │  │  ├─ auth.routes.js
│  │  │  ├─ chat.routes.js
│  │  │  └─ task.routes.js
│  │  ├─ services/
│  │  │  ├─ agent.service.js
│  │  │  ├─ email.service.js
│  │  │  ├─ openai.service.js
│  │  │  └─ taskExecutor.service.js
│  │  ├─ utils/
│  │  │  ├─ AppError.js
│  │  │  ├─ asyncHandler.js
│  │  │  ├─ token.js
│  │  │  └─ validators.js
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ .env.example
│  ├─ package.json
│  └─ README.md
├─ .env.example                    # Frontend env template
├─ tailwind.config.js
├─ postcss.config.js
└─ package.json
```

## Setup

### 1) Frontend environment

Create `.env` at repository root:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2) Backend environment

Create `backend/.env` from `backend/.env.example`.

Required for production features:

- `MONGO_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY` (for AI chat and command interpretation)
- `GOOGLE_CLIENT_ID` (for Google Sign-In)
- SMTP settings (for OTP and reset emails)

### 3) Install dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

### 4) Run development servers

Backend:

```bash
cd backend
npm run dev
```

Frontend (new terminal):

```bash
npm run dev
```

## Security Implemented

- Input validation using Zod
- Password hashing with bcrypt
- JWT-protected APIs
- CORS restriction to configured frontend URL
- Helmet headers and HPP protection
- Auth route rate limiting
- Sensitive flows: OTP + password reset tokens with expiration

## Notes

- Local task execution uses safe mapped actions (`open_whatsapp`, `open_word`, `compose_email`, `create_document`, `send_email`) instead of arbitrary shell command execution.
- If SMTP is not configured, email operations are logged in backend console for development.
- If OpenAI API key is not configured, command interpretation falls back to deterministic heuristic parsing.
