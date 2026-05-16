# Codebase Concerns

## Technical Debt
- **Missing Tests**: No automated tests (unit, integration, or E2E) were found in the codebase. This makes refactoring risky and increases the likelihood of regressions.
- **Typo in OpenAI Model**: `README.md` and configuration files refer to `gpt-4.1-mini`, which is likely meant to be `gpt-4o-mini` or another valid OpenAI model name.

## Architectural Risks
- **Local AI Service Dependency**: The reliance on a separate Python Flask service for intent classification adds complexity to the development and deployment pipelines.
- **Manual Data Cleanup**: Auth controllers explicitly call `signupCleanupService.runCleanup()` during signup, which could be handled by a background worker or database trigger for better scalability.

## Security Concerns
- **OTP Exposure**: There is a configuration `env.devOtpExposeInApi` which, if enabled in production, would leak OTPs.
- **Rate Limiting**: Rate limiting is only applied to auth routes (`/api/auth`). Other potentially expensive routes like `/api/tasks` are not currently limited.

## Performance Concerns
- **Puppeteer-core Overhead**: Executing browser automation tasks can be resource-intensive and may cause performance bottlenecks if multiple tasks run concurrently on limited hardware.
