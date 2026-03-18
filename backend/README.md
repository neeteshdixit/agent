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

## LLM Provider Setup

Default (OpenAI):

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

Gemini (OpenAI-compatible endpoint):

```env
OPENAI_API_KEY=AIza...
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.0-flash
```

## API modules

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

## Local Automation Commands

Supported command examples:

- `open whatsapp installed in my pc`
- `open whatsapp on chrome`
- `play shape of you on youtube on chrome`
- `send mail hello baby to someone@example.com`
- `send whatsapp message to HR maam hello baby how are you`
- `open downloads folder`
- `play music`
- `search best ai tools`

## Command Catalog (500,000 commands JSON)

Generate a large command catalog JSON and enable catalog-first routing:

```bash
npm run commands:generate
```

The generator creates `backend/data/commands.catalog.json` with 500,000 command entries by default.
You can override path with:

```env
COMMAND_CATALOG_PATH=./backend/data/commands.catalog.json
```

Routing order:

1. Exact match in command catalog JSON
2. Existing rule-based parser
3. LLM parser fallback (if configured)

## Reinforcement-Style Feedback Learning

The backend now includes a learning loop that improves command execution over time.

Flow:

1. Command received
2. Learned mapping lookup
3. Dataset/parser/LLM interpretation
4. Task execution
5. Task history logging
6. Success/failure feedback updates
7. Future commands use improved mappings

### New persistence tables

- `task_history`: command execution memory with `status`, `error_message`, `retry_after`, `attempts`, and failure suggestions.
- `command_learning_examples`: learned instruction-to-action mappings from successful runs and user corrections.

### Retry and cooldown behavior

- On failure, system stores the failure and sets `retry_after = now + 1 hour`.
- Repeating the same command before `retry_after` returns `status: waiting`.
- After 3 failed attempts, cooldown message is returned: task cannot be executed now; retry in 1 hour.

### Automatic learning updates

- On successful execution, the command is saved as a new learned dataset example.
- If a prior failed command appears corrected by a later successful command, the failed instruction is mapped to the corrected action automatically.

### Failure analysis suggestions

For repeated failures, system suggests safer alternatives (for example, fallback to WhatsApp Web in Chrome when desktop WhatsApp is unavailable).

For reliable WhatsApp Desktop sending:
- Use phone number directly: `send whatsapp message to +919876543210 saying hello`
- Or set contact mapping in `.env`:
  - `WHATSAPP_CONTACTS_JSON={"hr maam":"919876543210"}`

## Browser Automation

- Uses `puppeteer-core` to automate Chrome for safe, predefined actions.
- Set `CHROME_EXECUTABLE_PATH` in `.env` if Chrome is installed in a custom location.
