# Mail Campaign Backend (NestJS + Supabase + Railway)

Backend plan for a dashboard that lets marketing manage email campaigns dynamically.

## Architecture (proposed)
- NestJS monorepo style with feature modules:
  - `auth`: Supabase JWT validation + profile bootstrap.
  - `audiences`: manage lists, contacts, segments (filters).
  - `templates`: store HTML/text, variables, and preview.
  - `campaigns`: create/update campaigns, attach template + audiences, schedule sends.
  - `delivery`: enqueue sends, worker consumes queue and dispatches via SMTP/provider.
  - `webhooks`: ingest provider webhooks (opens, clicks, bounces, complaints).
- Queues: BullMQ + Redis (hosted on Railway). API pod handles writes/scheduling; worker pod sends emails and records events.
- Scheduling: cron/interval checks for campaigns with `status='scheduled'` and `scheduled_at <= now()`, then enqueue messages.
- Storage:
  - Supabase Postgres for relational data.
  - Supabase Storage (optional) for template assets if needed.
- Observability: Nest built-in logging; persist delivery events to Supabase; expose `/health` and `/metrics` (later).
- Deployment: Railway services
  - Service 1: `api` (Nest HTTP server)
  - Service 2: `worker` (Nest command entry running BullMQ worker + scheduler)
  - Service 3: `redis`

## Initial Supabase schema (migration-ready SQL)
Apply as a migration in the `Mail_Campaign` project once it finishes provisioning.

```sql
-- foundational
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  role text default 'member',
  created_at timestamptz not null default now()
);

-- audiences and contacts
create table if not exists public.audiences (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
  audience_id uuid not null references public.audiences(id) on delete cascade,
  email citext not null,
  attributes jsonb default '{}'::jsonb,
  status text not null default 'active', -- active | unsubscribed | bounced
  created_at timestamptz not null default now(),
  unique (audience_id, email)
);

-- templates
create table if not exists public.templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  body_html text,
  body_text text,
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- campaigns
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  template_id uuid references public.templates(id),
  status text not null default 'draft', -- draft | scheduled | sending | sent | paused | cancelled
  scheduled_at timestamptz,
  from_name text,
  from_email text,
  reply_to text,
  subject_override text,
  send_options jsonb default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_audiences (
  campaign_id uuid references public.campaigns(id) on delete cascade,
  audience_id uuid references public.audiences(id) on delete cascade,
  primary key (campaign_id, audience_id)
);

-- messages and events
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  provider_message_id text,
  status text not null default 'queued', -- queued | sending | sent | bounced | complained | failed
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, contact_id)
);

create table if not exists public.email_events (
  id bigserial primary key,
  message_id uuid references public.messages(id) on delete cascade,
  event_type text not null, -- delivered | opened | clicked | bounced | complained | unsubscribed
  occurred_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_events_message on public.email_events (message_id);
create index if not exists idx_events_type_time on public.email_events (event_type, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.audiences enable row level security;
alter table public.contacts enable row level security;
alter table public.templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_audiences enable row level security;
alter table public.messages enable row level security;
alter table public.email_events enable row level security;

-- basic RLS: users see their own data (adjust if teams introduced)
create policy "profiles are self" on public.profiles
  for select using (auth.uid() = user_id);

create policy "audiences rw" on public.audiences
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "contacts rw" on public.contacts
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "templates rw" on public.templates
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "campaigns rw" on public.campaigns
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "campaign audiences rw" on public.campaign_audiences
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "messages rw" on public.messages
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "events read" on public.email_events
  for select using (auth.role() = 'authenticated');
```

## NestJS project plan
1) Scaffold: `npm i -g @nestjs/cli && nest new backend` (or pnpm). Add env config for Supabase + SMTP + Redis.
2) Install deps: `@supabase/supabase-js`, `pg`, `bullmq`, `@nestjs/bullmq`, `class-validator`, `@nestjs/config`.
3) Config structure: `.env` containing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (for verifying client JWTs), `REDIS_URL`, `SMTP_*` or provider API key.
4) Modules outline:
   - `supabase` module: exports a typed client (service role) + guard to decode JWT.
   - `audiences` module: CRUD audiences, contacts import (CSV later), optional segment filters.
   - `templates` module: CRUD; preview endpoint with sample variables.
   - `campaigns` module: create/schedule, attach audiences, set from/reply-to, subject override.
   - `jobs` module: scheduler + queue producer; worker app consumes and sends emails via SMTP/provider.
   - `events` module: webhook handlers to upsert `email_events` and update `messages.status`.
5) DTO/Validation: `class-validator` on inputs; global `ValidationPipe`.
6) Security: Supabase JWT guard for user-facing endpoints; separate `SERVICE_ROLE_KEY` for worker to persist events safely.
7) Testing: start with e2e using `@nestjs/testing` + `supertest` for critical flows (create campaign, schedule, enqueue).

## Delivery flow (happy path)
1) Marketing creates template and campaign; selects audiences; sets schedule.
2) Scheduler picks due campaigns and enqueues message jobs (one per contact) with deduping.
3) Worker sends email (SMTP or provider API), updates `messages.status` and `sent_at`.
4) Provider webhook calls `/webhooks/email` → validate signature → store `email_events` and update `messages.status`.
5) Dashboard reads aggregated stats (opens/clicks/bounces) and campaign progress.

## Next steps
- Confirm tenancy needs (single team vs multi-team) to refine RLS.
- Once Supabase project becomes ACTIVE, apply the SQL above via MCP migration.
- Scaffold Nest project and wire Supabase client, auth guard, and first modules (`audiences`, `templates`, `campaigns`).
- Stand up Redis on Railway; split API and worker services; add healthchecks.

