# Testing Practices

## Current State
- **No Automated Tests Found**: A scan of the repository did not reveal any standard test directories (`tests/`, `__tests__/`) or test files (`*.test.js`, `*.spec.js`).

## Recommended Testing Strategy
1. **Unit Testing**:
   - Use **Vitest** or **Jest** for logic in services and repositories.
   - Target complex logic like OTP verification and intent parsing.

2. **Integration Testing**:
   - Test API endpoints using **Supertest**.
   - Verify DB interactions and external service mocks (OpenAI, SMTP).

3. **End-to-End (E2E) Testing**:
   - Use **Playwright** or **Cypress** for critical user flows (Login, Chat, Task execution).

4. **ML Testing**:
   - Evaluate intent model accuracy using a held-out test set in the Python AI service.
