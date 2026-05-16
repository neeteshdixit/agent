# External Integrations

## Databases
- **PostgreSQL**: Primary relational database for users, sessions, chats, and task logs. Managed via `pg` pool.

## AI & NLP
- **OpenAI API**: Used for advanced chat interpretation and command generation. Model: `gpt-4.1-mini`.
- **Local Python Service**: Custom Flask app for intent classification using scikit-learn models.

## Authentication
- **Google OAuth**: Integrated using `google-auth-library` on the backend.
- **OTP (Email)**: Custom implementation using Nodemailer for signup and password reset.

## Communication
- **SMTP**: Used for sending transactional emails (OTP, password reset).
- **WhatsApp**: Mentions of WhatsApp contacts in `.env` (`WHATSAPP_CONTACTS_JSON`), likely used for automation commands.

## Browser Automation
- **Chrome/Chromium**: Controlled via Puppeteer-core for executing web-based tasks.

## OS Utilities
- **node-os-utils**: Used for monitoring system resources (likely for the "digital brain" aspect).
