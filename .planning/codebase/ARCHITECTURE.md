# System Architecture

## Overview
The system is a full-stack AI Assistant composed of a React frontend, a Node.js backend, and a specialized Python AI service for command understanding.

## Core Layers
1. **Frontend (React)**:
   - UI Components for chat, task management, and authentication.
   - Context providers for state management (Auth, Chat).
   - Interaction with the Backend API.

2. **Backend (Node.js/Express)**:
   - REST API for frontend communication.
   - Authentication management (JWT, OAuth, OTP).
   - Task orchestration (interpreting commands and executing tools).
   - Integration with external services (OpenAI, SMTP, Python AI Service).
   - Data persistence using PostgreSQL.

3. **AI Service (Python/Flask)**:
   - Specialized ML service for intent classification.
   - Uses scikit-learn for prediction and RapidFuzz for fuzzy matching.
   - Maintains a local reinforcement memory for learning from feedback.

4. **Execution Layer (Tools)**:
   - Puppeteer for browser automation.
   - Nodemailer for email automation.
   - Shell/System commands for local tasks.

## Data Flow
- **User Query**: Voice/Text input from Frontend -> Backend.
- **Intent Detection**: Backend -> Python AI Service (or OpenAI fallback) -> Intent & Parameters.
- **Task Execution**: Backend executes corresponding tool based on intent -> Logs results to DB.
- **Feedback Loop**: User provides feedback -> Backend -> Python AI Service updates memory.

## Design Patterns
- **Repository Pattern**: Used for database interactions to decouple business logic from SQL.
- **Controller-Service-Repository**: Standard N-tier architecture in the backend.
- **Provider Pattern**: React Context for global state management.
