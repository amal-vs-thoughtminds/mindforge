# MindForge Q4 '26 — ThoughtMinds Hackathon Registration

Quarterly hackathon (register any time until Dec 10, 2026; evaluation in December). Single-page registration app: solo or team (2–4) sign-ups, prizes, tracks, timeline, FAQ.
Stack: **React (Vite)** · **Express** · **Sequelize + sequelize-cli migrations** · **PostgreSQL** · **Docker Compose**.

## Run

```bash
cp .env.example .env   # optional — defaults work out of the box
docker compose up -d --build
```

Open http://localhost:8080. Migrations run automatically when the backend starts.
Postgres is exposed on `localhost:5433` (user/pass/db: `mindforge`).

## Local dev (without Docker for the apps)

```bash
docker compose up -d db
cd backend && DB_PORT=5433 npm run migrate && DB_PORT=5433 npm run dev
cd frontend && npm run dev     # http://localhost:5173, proxies /api to :4000
```

## Registration rules (enforced server-side)

- An email can be registered **once**, either solo or in exactly one team (case-insensitive).
  Enforced by a DB unique constraint, so concurrent submissions can't slip through.
- Teams have `MIN_TEAM_SIZE`–`MAX_TEAM_SIZE` members (default 2–4). Member 1 is the team lead.
- No duplicate emails within a team; team names are unique (case-insensitive).
- Submissions after `REGISTRATION_DEADLINE` are rejected.
- Rate limited: 20 registration attempts / 15 min per IP.

## Teams pages

- `/teams`: every team and solo participant, with search and a track filter.
- `/teams/:id`: one team: track, project idea, members (lead marked), organisation, role, GitHub.

Emails and phone numbers are **never public**. To see them, set `ADMIN_TOKEN` in `.env`, restart
(`docker compose up -d`), then click **Organiser view** on either page and enter that key. The key is kept
in the browser tab's session storage only.

## API

| Method | Path | |
|---|---|---|
| GET | `/api/event` | Tracks, team size limits, deadline, open/closed |
| GET | `/api/stats` | Participant / team / solo counts |
| GET | `/api/check/email?email=` | `{ available }` |
| GET | `/api/check/team-name?name=` | `{ available }` |
| GET | `/api/teams` | Team summaries (public) |
| GET | `/api/teams/:id` | Team with members; adds email/phone with a valid `x-admin-token` header |
| GET | `/api/solo` | Solo participants; adds email/phone with a valid `x-admin-token` header |
| GET | `/api/admin/verify` | 200 if `x-admin-token` matches `ADMIN_TOKEN` |
| POST | `/api/registrations/solo` | `{ participant, track, agreeToRules }` |
| POST | `/api/registrations/team` | `{ teamName, track, projectIdea?, members[], agreeToRules }` |

## Editing content

Prizes, dates, venue, tracks, timeline, rules and FAQ live in `frontend/src/content.js`.
Track names must also match `backend/src/config/event.js`.

## Export registrations

```bash
docker compose exec db psql -U mindforge -c "\copy (select p.*, t.name as team_name from participants p left join teams t on t.id = p.team_id order by p.id) to stdout csv header" > registrations.csv
```
