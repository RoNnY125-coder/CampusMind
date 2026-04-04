<div align="center">

```
 ██████╗ █████╗ ███╗   ███╗██████╗ ██╗   ██╗███████╗
██╔════╝██╔══██╗████╗ ████║██╔══██╗██║   ██║██╔════╝
██║     ███████║██╔████╔██║██████╔╝██║   ██║███████╗
██║     ██╔══██║██║╚██╔╝██║██╔═══╝ ██║   ██║╚════██║
╚██████╗██║  ██║██║ ╚═╝ ██║██║     ╚██████╔╝███████║
 ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚══════╝
     M  I  N  D
```

### 🎓 Your AI Campus Assistant — Memory-First · Always Learning · Built for Students

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq_LLaMA_3.3-F55036?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed_on_Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

**[🚀 Live Demo](https://campus-mind-flame.vercel.app)** · **[📦 Repository](https://github.com/RoNnY125-coder/campus-mind)**

---

</div>

## ✦ What is CampusMind?

CampusMind is an **AI-powered campus assistant** built for college students. It remembers your name, your branch, your interests, your clubs — and gets smarter with every conversation. Think of it as a brilliant senior student who's always available, never forgets anything you've told them, and genuinely wants to help.

```
  Student: "I'm in 3rd year CSE, interested in ML"
       ↓
  CampusMind remembers this forever
       ↓
  Next chat: "Hey! Since you're into ML, there's a Kaggle
              competition this Friday — want tips to prep?"
```

---

## ✦ Features

<table>
<tr>
<td width="50%">

### 🧠 Persistent Memory Bank
Every conversation is saved and displayed in a real-time **Memory sidebar**. CampusMind pulls context from your past chats to personalise every response — your branch, interests, clubs, and goals are always remembered.

</td>
<td width="50%">

### 💬 Full Chat History
Every conversation is persisted to **Supabase** with session tracking. Switch between past chats from the sidebar — click any session to instantly reload the full conversation exactly as it was.

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Real-time Streaming
Powered by **Groq's LLaMA 3.3 70B** — one of the fastest LLMs available. Responses stream token-by-token in real time with animated typing indicators so you always know the AI is thinking.

</td>
<td width="50%">

### 🔐 Secure Authentication
Email-based login via **NextAuth v4** with JWT sessions. New accounts are created automatically on first login — no sign-up form needed. All secrets secured server-side, never exposed to the browser.

</td>
</tr>
<tr>
<td width="50%">

### 🎓 4-Step Onboarding
A beautiful multi-step profile setup collects your **name, year, branch, interests, and clubs** (16 clubs available). This data seeds your memory bank so CampusMind knows you from message one.

</td>
<td width="50%">

### 🗄️ Supabase Database
Full relational schema with **students, chat_sessions, chat_messages,** and **campus_events** tables. Row Level Security enabled. Service role key used server-side only — anon key safe for the browser.

</td>
</tr>
</table>

---

## ✦ Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      CAMPUSMIND STACK                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   FRONTEND          BACKEND           DATABASE              │
│   ─────────         ────────          ────────              │
│   Next.js 16        Next.js API       Supabase              │
│   React 18          Routes            PostgreSQL            │
│   Tailwind CSS      NextAuth v4       Row Level             │
│   Framer Motion     Groq SDK          Security              │
│   Lucide React      Streaming API                           │
│                                                             │
│   AI MODEL          AUTH              DEPLOYMENT            │
│   ────────          ────────          ──────────            │
│   LLaMA 3.3 70B     JWT Sessions      Vercel                │
│   via Groq          Credentials       Edge-ready            │
│   Streaming         Provider          Auto-deploy           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✦ Project Structure

```
campusmind/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── chat/                  # Groq streaming endpoint
│   │   ├── memory/                # Memory bank (Supabase)
│   │   ├── onboard/               # Student profile creation
│   │   ├── sessions/              # Chat session list
│   │   │   └── messages/          # Session message loader
│   │   └── seed/                  # Campus events seeder
│   ├── chat/                      # Main chat page
│   ├── login/                     # Auth page
│   ├── onboard/                   # 4-step onboarding flow
│   └── page.tsx                   # Landing page
│
├── components/
│   ├── ChatWindow.tsx             # Streaming chat UI + session support
│   ├── MemorySidebar.tsx          # Memory + Chats tabs
│   └── Providers.tsx              # NextAuth session provider
│
└── lib/
    ├── auth.ts                    # NextAuth config + Supabase user creation
    ├── groq.ts                    # System prompt builder
    ├── types.ts                   # Shared TypeScript types
    └── utils.ts                   # Helpers
```

---

## ✦ Database Schema

```sql
-- Students (one row per user)
students          → id, email, name, year, branch,
                    interests[], clubs[], has_onboarded

-- Conversations
chat_sessions     → id, student_id, title, created_at
chat_messages     → id, session_id, student_id, role, content

-- Campus data
campus_events     → id, name, description, event_date,
                    location, category
```

---

## ✦ Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### 1 — Clone & Install

```bash
git clone https://github.com/RoNnY125-coder/campus-mind.git
cd campus-mind
npm install
```

### 2 — Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```env
# Groq — https://console.groq.com
GROQ_API_KEY=your_groq_api_key

# Supabase — https://supabase.com/dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   

# NextAuth
NEXTAUTH_SECRET=your_random_secret                # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

### 3 — Set up Supabase schema

Run this SQL in your **Supabase SQL Editor**:

```sql
create extension if not exists "uuid-ossp";

create table public.students (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  name          text,
  year          text,
  branch        text,
  interests     text[] default '{}',
  clubs         text[] default '{}',
  has_onboarded boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.chat_sessions (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  title      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  session_id uuid references public.chat_sessions(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  role       text check (role in ('user','assistant')) not null,
  content    text not null,
  created_at timestamptz default now()
);

alter table public.students      enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "Service role all" on public.students      for all using (true) with check (true);
create policy "Service role all" on public.chat_sessions for all using (true) with check (true);
create policy "Service role all" on public.chat_messages for all using (true) with check (true);
```

### 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — enter any email to create your account.

---

## ✦ Environment Variables Reference

| Variable | Required | Where to get it |
|---|---|---|
| `GROQ_API_KEY` | ✅ | [console.groq.com](https://console.groq.com) → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase → Settings → API ⚠️ secret |
| `NEXTAUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ✅ | `http://localhost:3000` (local) or your Vercel URL |

---

## ✦ Deploying to Vercel

```bash
# Push to GitHub
git add .
git commit -m "feat: initial deploy"
git push origin main
```

Then in **Vercel Dashboard**:
1. Import your GitHub repository
2. Add all 6 environment variables from the table above
3. Set `NEXTAUTH_URL` to your Vercel production URL
4. Deploy — auto-deploys on every push to `main`

---

## ✦ How the Memory System Works

```
User sends message
       │
       ▼
  /api/chat receives it
       │
       ├──► Groq LLaMA 3.3 generates response (streaming)
       │
       ├──► Response saved to chat_messages (Supabase)
       │
       └──► Memory sidebar polls /api/memory every 8s
                   │
                   └──► Reads latest assistant messages
                         from chat_messages table
                         → displays as memory cards
                         → new cards flash green on arrival
```

---

## ✦ Clubs Supported

```
Coding Club          Photography Club      Robotics Club
Entrepreneurship     AI & ML Society       Cybersecurity Club
Music Club           Drama Society         Literary Club
Finance Club         Sports Committee      Design Studio
NSS                  Cultural Committee    Debate Club
Film Society
```

---

## ✦ Roadmap

- [ ] Memo AI integration for smarter vector memory
- [ ] Google OAuth login
- [ ] Campus events calendar with reminders
- [ ] Mobile app (React Native)
- [ ] Multi-college support
- [ ] Voice input support
- [ ] Dark/light theme toggle

---

## ✦ Security

- All API keys accessed **server-side only** via API routes
- `SUPABASE_SERVICE_ROLE_KEY` never exposed to browser
- `NEXT_PUBLIC_` prefix only on safe anon key and URL
- `.env.local` in `.gitignore` — never committed
- NextAuth JWT sessions with signed secrets
- Supabase Row Level Security enabled on all tables

---

## ✦ Contributing

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: your feature description"
git push origin feature/your-feature
# Open a Pull Request
```

---

## ✦ License

MIT — free to use, modify and distribute.

---

<div align="center">

```
Built with ♥ for students, by a student
```

[![GitHub](https://img.shields.io/badge/GitHub-RoNnY125--coder-181717?style=for-the-badge&logo=github)](https://github.com/RoNnY125-coder)
[![Live](https://img.shields.io/badge/Live_App-campus--mind--flame.vercel.app-2563eb?style=for-the-badge&logo=vercel)](https://campus-mind-flame.vercel.app)

*CampusMind — because every student deserves an AI that actually knows them.*

</div>
