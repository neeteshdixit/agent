# Directory Structure

## Root Level
- `src/`: Frontend React source code.
- `backend/`: Node.js backend and Python AI service.
- `dist/`: Build output for frontend.
- `public/`: Static assets for frontend.
- `postgres-local/`: Likely local DB configuration or storage.

## Frontend (`src/`)
- `components/`: Reusable UI components (Layout, Sections, UI elements).
- `context/`: React Context providers (Auth, Chat, Theme).
- `hooks/`: Custom React hooks (useAuth, useChat, useSpeech).
- `lib/`: Utility libraries and API clients.
- `pages/`: Page-level components (Login, Dashboard, Signup).
- `App.jsx`: Main application component and routing.
- `main.jsx`: Application entry point.

## Backend (`backend/src/`)
- `config/`: Configuration files (env, database).
- `controllers/`: Request handlers for routes.
- `middleware/`: Express middleware (auth, error handling, validation).
- `repositories/`: Database abstraction layer (queries).
- `routes/`: API route definitions.
- `services/`: Business logic (AI interaction, Task execution, Auth logic).
- `utils/`: Shared utility functions (logging, formatting).
- `scripts/`: Initialization and maintenance scripts.
- `server.js`: Server entry point.
- `app.js`: Express application setup.

## AI Service (`backend/ai/`)
- `app.py`: Flask API entry point.
- `train.py`: Script for training the intent model.
- `intent_model.py`: Model definition and logic.
- `data/`: Datasets and reinforcement memory.
- `models/`: Serialized model files (`.joblib`).
