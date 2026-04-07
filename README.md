# LinkedIn People Hunt

Internal Personeel.com application for LinkedIn people outbound activation.

## Goal

Phase 1 supports:
- per-user login
- per-user LinkedIn extension connection
- ingest from LinkedIn people search result URL
- eligibility + Salesforce duplicate skip before send
- one-message send tracking
- reply sync queue
- manual push to Salesforce only after reply

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Auth.js (NextAuth Credentials)
- Zod
- Tailwind-based internal admin UI
- Chrome extension (Manifest V3) in `/extension`

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Migrate database:

```bash
npm run prisma:migrate -- --name init
```

4. Create first internal user:

```bash
npm run user:create -- rep@personeel.com yourpassword "Internal Rep" admin
```

5. Run app:

```bash
npm run dev
```

Login at `http://localhost:3000/login`.

## Extension

- Source is in `/extension`.
- Current MVP uses direct script files (`background.js`, `content.js`).
- Load unpacked extension in Chrome from the `/extension` folder.
- Use `/settings/linkedin` + handshake endpoints to connect session.

## Important Product Guards

- No hard company lock.
- Cross-user person collisions are warnings/soft status only.
- Existing Salesforce matches are skipped before messaging.
- Unreplied prospects are not pushable to Salesforce.
- Push ownership uses logged-in rep `salesforceOwnerId`.
- `LeadSource` is forced to `LinkedIn`.

## Tests

```bash
npm test
```

Includes unit coverage for:
- LinkedIn URL normalization
- Scoring
- Salesforce mapping
- Duplicate query strategy
- State transitions
- Extension session token
- LinkedIn parser fixture extraction
