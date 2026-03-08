# AI Assistant Backend (Node.js + Express)

## Setup

1. Copy `.env.example` to `.env` and fill required values.
2. Ensure PostgreSQL is running and `DATABASE_URL` points to your database.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```

On startup the backend initializes required tables automatically.

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

## Local Automation Commands

Supported command examples:

- `open whatsapp`
- `open installed whatsapp in my pc`
- `open whatsapp on chrome`
- `open word`
- `open chrome`
- `open downloads folder`
- `play music`
- `play shape of you on youtube on chrome`
- `search ai tutorials on youtube`
- `send email to someone@example.com saying hello`

## Browser Automation

- Uses `puppeteer-core` to automate Chrome for safe, predefined actions.
- Set `CHROME_EXECUTABLE_PATH` in `.env` if Chrome is installed in a custom location.
