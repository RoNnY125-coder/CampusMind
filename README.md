# CampusMind

CampusMind is a memory-first AI campus assistant for students, built with Next.js and persistent profile/chat context.

## Stack

- Next.js 14+ (App Router)
- Groq with LLaMA 3.3 70B (streaming chat)
- Hindsight (vectorize.io) memory banks
- Supabase (Postgres + auth-aligned data layer)
- NextAuth v4 (credentials provider)
- Tailwind CSS + Framer Motion

## Setup

1. Clone the repository.
2. Copy `.env.local.example` to `.env.local`.
3. Fill all required environment values.
4. Install dependencies:
   - `npm install`
5. Start development server:
   - `npm run dev`

## Environment Variables

| Variable | Where to get it | Required |
|---|---|---|
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com) | Yes |
| `HINDSIGHT_API_KEY` | [Vectorize/Hindsight](https://vectorize.io) | Yes |
| `HINDSIGHT_BASE_URL` | Hindsight docs (`https://api.hindsight.vectorize.io`) | Optional |
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project API keys | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project API keys (service role) | Yes (server only) |
| `NEXTAUTH_SECRET` | Generated secret (`openssl rand -base64 32`) | Yes |
| `NEXTAUTH_URL` | App base URL (e.g. `http://localhost:3000`) | Yes |

## Architecture

CampusMind uses dual memory recall:

- **Student bank**: per-user memory (`student_<userId>`) for profile, interests, and prior interactions.
- **Campus bank**: shared knowledge (`campus_knowledge`) for global campus events and references.

At chat time, both banks are recalled in parallel, merged into the system prompt, and responses are streamed from Groq. Chat sessions and messages are persisted in Supabase for durable history.

## Database

Run the SQL schema and RLS setup from the project upgrade notes (Phase 1) in your Supabase SQL Editor before using chat/session persistence.

## Contributing

- Keep secrets out of source control (`.env*` is ignored).
- Use `lib/env.ts` for environment access in server code.
- Keep UI changes aligned with the black/white/blue design system.
- Open focused PRs with clear test notes.

## License

MIT
