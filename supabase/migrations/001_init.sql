-- Core extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  role text default 'member',
  created_at timestamptz not null default now()
);

-- Audiences and contacts
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
  status text not null default 'active', -- active | unsubscribed | bounced | complained
  created_at timestamptz not null default now(),
  unique (audience_id, email)
);

-- Templates
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

-- Campaigns
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
  send_options jsonb default '{}'::jsonb, -- holds time_windows, date_range, recurrence, delivery_cap
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_audiences (
  campaign_id uuid references public.campaigns(id) on delete cascade,
  audience_id uuid references public.audiences(id) on delete cascade,
  primary key (campaign_id, audience_id)
);

-- Messages and events
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

-- Upload staging
create table if not exists public.upload_batches (
  id uuid primary key default uuid_generate_v4(),
  filename text,
  status text not null default 'processing', -- processing | completed | failed
  total_rows integer default 0,
  valid_rows integer default 0,
  invalid_rows integer default 0,
  error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.staged_contacts (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references public.upload_batches(id) on delete cascade,
  email citext,
  attributes jsonb default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_events_message on public.email_events (message_id);
create index if not exists idx_events_type_time on public.email_events (event_type, occurred_at desc);
create index if not exists idx_upload_status on public.upload_batches (status);

-- RLS enablement
alter table public.profiles enable row level security;
alter table public.audiences enable row level security;
alter table public.contacts enable row level security;
alter table public.templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_audiences enable row level security;
alter table public.messages enable row level security;
alter table public.email_events enable row level security;
alter table public.upload_batches enable row level security;
alter table public.staged_contacts enable row level security;

-- Policies (baseline authenticated access)
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

create policy "upload batches rw" on public.upload_batches
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "staged contacts rw" on public.staged_contacts
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

