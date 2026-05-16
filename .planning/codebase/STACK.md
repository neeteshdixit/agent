# Tech Stack

## Core Technologies
- **Frontend**: React 19, Vite 7, TailwindCSS 3.4
- **Backend**: Node.js 20+, Express 4.21
- **AI Service**: Python 3, Flask 3.0, scikit-learn 1.5
- **Database**: PostgreSQL 14+ (pg driver)

## Languages & Runtimes
- **JavaScript**: ES Modules (ESM) used in both frontend and backend
- **Python**: Used for ML-based intent classification
- **SQL**: PostgreSQL for data persistence

## Frameworks & Libraries
- **React**: Modern functional components with hooks
- **Vite**: Build tool and dev server
- **Express**: Middleware-based web framework
- **TailwindCSS**: Utility-first CSS framework
- **Puppeteer-core**: Used for browser automation tasks
- **OpenAI Node Library**: For GPT-4.1-mini integration
- **Nodemailer**: For SMTP email handling
- **scikit-learn**: For intent prediction models
- **RapidFuzz**: For string matching and spell correction in AI service

## Configuration
- **Frontend**: `.env` with `VITE_API_BASE_URL`
- **Backend**: `backend/.env` with DB, SMTP, and AI service configurations
- **Vite**: `vite.config.js` with basic React plugin
- **Tailwind**: `tailwind.config.js` and `postcss.config.js`
