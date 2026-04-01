# CampusMind

CampusMind is a memory-first AI campus assistant for students, built with Next.js and persistent profile/chat context.

## Stack

- Next.js 14+ (App Router)
- Groq with LLaMA 3.3 70B (streaming chat)
- Hindsight (vectorize.io) memory banks
- **Supabase Auth** (email/password + Google OAuth) and Postgres for `students` / chat tables
- Tailwind CSS + Framer Motion

## Authentication

- **Email/password**: `/login` and `/signup` use `supabase.auth.signInWithPassword` / `signUp`.
- **Google**: `signInWithOAuth({ provider: 'google' })` with callback at `/auth/callback`.
- **Session**: `@supabase/ssr` browser client + `SupabaseAuthProvider` (`getSession` + `onAuthStateChange`) so the session persists across refresh.
- **Profile row**: `POST /api/auth/ensure-profile` upserts `public.students` using the service role after verifying the user JWT.

### Supabase dashboard checklist

1. **Authentication → Providers**: enable Email, enable Google (add OAuth client ID/secret from Google Cloud Console).
2. **Authentication → URL configuration**:
   - Site URL: your production URL (or `http://localhost:3000` for dev).
   - Redirect URLs: include `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`.
3. **Database**: ensure `students` exists and `students.id` matches `auth.users.id` (UUID). The API upserts on login/OAuth.

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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only) | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for OAuth | Optional (defaults to origin in app) |

## Architecture

CampusMind uses dual memory recall:

- **Student bank**: per-user memory (`student_<userId>`) for profile, interests, and prior interactions.
- **Campus bank**: shared knowledge (`campus_knowledge`) for global campus events and references.

At chat time, both banks are recalled in parallel, merged into the system prompt, and responses are streamed from Groq. Chat sessions and messages are persisted in Supabase for durable history.

## Database

Run the SQL schema and RLS setup from your Supabase SQL Editor before using chat/session persistence. Ensure policies allow authenticated users to work with their own `students` row where applicable.

## Contributing

- Keep secrets out of source control (`.env*` is ignored).
- Use `lib/env.ts` for environment access in server code.
- Keep UI changes aligned with the black/white/blue design system.
- Open focused PRs with clear test notes.

## License

MIT
