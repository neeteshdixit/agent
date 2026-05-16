# Coding Conventions

## Languages & Standards
- **JavaScript**: modern ES Modules (ESM) syntax.
- **Node.js**: standard library (e.g., `node:crypto`, `node:fs/promises`).

## Naming Conventions
- **Variables & Functions**: `camelCase`.
- **Classes & Components**: `PascalCase`.
- **Constants**: `UPPER_SNAKE_CASE`.
- **Files**:
  - Components: `PascalCase.jsx` (e.g., `ChatPanel.jsx`).
  - Logic: `camelCase.js` (e.g., `auth.controller.js`, `user.repository.js`).
  - Routes: `*.routes.js`.

## Code Structure
- **Controllers**: Handle HTTP requests, call services or repositories, and return responses.
- **Services**: Contain business logic that may span multiple repositories or external integrations.
- **Repositories**: Pure data access layer using SQL queries.
- **Middleware**: Standard Express middleware pattern for auth, validation, and errors.

## Error Handling
- **Backend**: Use custom `AppError` class for operational errors. Centralized `errorHandler` middleware handles response formatting.
- **Frontend**: Likely standard try/catch with toast notifications (based on typical modern React apps).

## State Management
- **Frontend**: React Context API for global states like `AuthContext`.
- **Backend**: Stateless JWT-based authentication stored in HTTP-only cookies.

## API Design
- **RESTful**: standard HTTP methods (GET, POST, etc.) and status codes.
- **JSON**: All request/response bodies are JSON.
- **Validation**: Input validation using Zod (referenced in `package.json`).
