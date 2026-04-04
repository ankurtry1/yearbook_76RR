# Yearbook V2

This is the shared, roster-based version of the yearbook app.

## Stack
- React + Vite
- Supabase Auth (email OTP only)
- Supabase Database
- Netlify frontend deployment

## Product decisions locked
- Roster-only login. No public signup.
- Email OTP for roster emails only.
- Default landing after login = Write mode.
- Desktop write mode = scrapbook cloud with inline expansion.
- Mobile write mode = story-style clustered discovery with bottom sheet composer.
- Read mode = playful wall of cards, each card = one memoir from one person.
- Anonymous memoirs show placeholder silhouette and "Anonymous" only.
- Multiple memoirs allowed per sender-recipient pair.
- No edit, no delete.
- Reactions only in V2: ❤️ 😂 🥹 🫡
- Backend hard cap: 10,000 chars.

## Run locally

```bash
cd v2
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and fill Supabase credentials.
