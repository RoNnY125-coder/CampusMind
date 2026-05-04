-- Enable pgvector
create extension if not exists vector;

-- Add college_id to clubs table (create if not exists)
create table if not exists colleges (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  city       text,
  created_at timestamptz default now()
);

-- Seed VIT Bhopal
insert into colleges (name, slug, city)
values ('VIT Bhopal University', 'vit-bhopal', 'Bhopal')
on conflict (slug) do nothing;

-- Clubs table (full schema)
create table if not exists clubs (
  id           uuid primary key default gen_random_uuid(),
  college_id   uuid references colleges(id) on delete cascade,
  name         text not null,
  category     text not null,
  description  text,
  contact      text,
  tags         text[],
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Club embeddings for RAG
create table if not exists club_embeddings (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid references clubs(id) on delete cascade,
  chunk_text text not null,
  embedding  vector(768),
  created_at timestamptz default now()
);

-- Vector similarity search function
create or replace function match_clubs(
  query_embedding vector(768),
  college_filter  uuid,
  match_count     int default 5
)
returns table (
  club_id    uuid,
  club_name  text,
  chunk_text text,
  category   text,
  contact    text,
  similarity float
)
language sql stable as $$
  select
    c.id        as club_id,
    c.name      as club_name,
    ce.chunk_text,
    c.category,
    c.contact,
    1 - (ce.embedding <=> query_embedding) as similarity
  from club_embeddings ce
  join clubs c on c.id = ce.club_id
  where c.college_id = college_filter
    and c.is_active = true
  order by ce.embedding <=> query_embedding
  limit match_count;
$$;

-- Add college_id to students if not present
alter table students add column if not exists college_id uuid references colleges(id);

-- RLS policies
alter table clubs enable row level security;
alter table club_embeddings enable row level security;
alter table colleges enable row level security;

create policy "clubs_public_read" on clubs for select using (is_active = true);
create policy "embeddings_public_read" on club_embeddings for select using (true);
create policy "colleges_public_read" on colleges for select using (true);
