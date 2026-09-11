# Implementation Notes

## Architecture Decisions
- Next.js App Router for frontend + backend API routes.
- SQLite as the primary database with Prisma ORM (for local MVP).
- In-memory rate limiting / simple transient state since Redis is unavailable.
- Resend for transactional emails.
- Google Sheets API for asynchronous backups.

## Security Decisions
- **Authoritative Server:** The client browser is entirely untrusted. All timing, random question selection, answer validation, and score calculation happens on the server.
- **One Question at a Time:** The complete question bank is never sent to the client.
- **Result Confidentiality:** Correct answers are not returned to the client to avoid exposure via network interception.

## Environment Variables
The following environment variables will be required:
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL`
- `EMAIL_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT`
- `GOOGLE_SHEET_ID`
- `SESSION_SECRET`
- `ADMIN_AUTH_SECRET`
- `SENTRY_DSN`

## Assumptions
- PostgreSQL connection string will be provided by the environment.
- If Redis is unavailable in development, rate limiting will be silently skipped or replaced with a basic memory implementation.
- Email generation is non-blocking.
