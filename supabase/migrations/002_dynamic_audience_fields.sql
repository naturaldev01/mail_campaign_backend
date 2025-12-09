-- Audience dynamic + filter support
alter table public.audiences
  add column if not exists type text not null default 'static',
  add column if not exists filter_rules jsonb default '[]'::jsonb,
  add column if not exists sync_provider text,
  add column if not exists sync_config jsonb default '{}'::jsonb,
  add column if not exists last_synced_at timestamptz;

alter table public.audiences
  add constraint audiences_type_check check (type in ('static', 'dynamic'));

create index if not exists idx_audiences_type on public.audiences (type);
create index if not exists idx_audiences_sync_provider on public.audiences (sync_provider);

