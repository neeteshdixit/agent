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

For reliable WhatsApp Desktop sending:
- Use phone number directly: `send whatsapp message to +919876543210 saying hello`
- Or set contact mapping in `.env`:
  - `WHATSAPP_CONTACTS_JSON={"hr maam":"919876543210"}`

## Browser Automation

- Uses `puppeteer-core` to automate Chrome for safe, predefined actions.
- Set `CHROME_EXECUTABLE_PATH` in `.env` if Chrome is installed in a custom location.
