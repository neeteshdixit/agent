# AI Assistant Backend (Node.js + Express)

## Setup

1. Copy `.env.example` to `.env` and fill required values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```

## API modules

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /api/chat/sessions`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:sessionId`
- `POST /api/chat/message`
- `DELETE /api/chat/sessions/:sessionId`
- `GET /api/tasks/history`
- `POST /api/tasks/run`
