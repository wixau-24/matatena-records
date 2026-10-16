-- Matatena Records — Esquema de Base de Datos (Supabase / PostgreSQL)
-- Ejecuta este script en el SQL Editor de Supabase o mediante `npm run db:setup`

create table if not exists public.matatena_settings (
  id text primary key default 'default',
  open_hour integer not null default 10,
  close_hour integer not null default 22,
  base_hours integer not null default 4,
  extra_hour_rate integer not null default 400,
  pricing jsonb not null default '{
    "grado_1": 2000,
    "grado_2": 3000,
    "grado_3": 4000,
    "experiencia_compositora": 4500
  }'::jsonb,
  blocked_slots jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.matatena_gear (
  id text primary key,
  category text not null,
  category_label text not null,
  name text not null,
  spec text not null default '',
  badge text not null default '',
  available boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.matatena_bookings (
  id text primary key,
  folio text not null unique,
  service_type text not null,
  tier_id text not null,
  tier_title text not null,
  booking_date text not null,
  start_hour integer not null,
  end_hour integer not null,
  base_hours integer not null default 4,
  extra_hours integer not null default 0,
  total_hours integer not null default 4,
  base_price_mxn integer not null default 0,
  extra_price_mxn integer not null default 0,
  total_price_mxn integer not null default 0,
  is_custom_quote boolean not null default false,
  customer_name text not null,
  customer_email text not null default '',
  customer_phone text not null,
  project_name text not null default '',
  attendees_count integer not null default 1,
  age_group text not null default 'Todas las edades',
  selected_gear jsonb not null default '[]'::jsonb,
  event_details text not null default '',
  status text not null default 'pendiente',
  admin_notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_matatena_bookings_date
  on public.matatena_bookings (booking_date);

-- Políticas RLS para permitir lectura/escritura desde la API de la app
alter table public.matatena_settings enable row level security;
alter table public.matatena_gear enable row level security;
alter table public.matatena_bookings enable row level security;

drop policy if exists "matatena_settings_public_all" on public.matatena_settings;
create policy "matatena_settings_public_all"
  on public.matatena_settings for all
  using (true)
  with check (true);

drop policy if exists "matatena_gear_public_all" on public.matatena_gear;
create policy "matatena_gear_public_all"
  on public.matatena_gear for all
  using (true)
  with check (true);

drop policy if exists "matatena_bookings_public_all" on public.matatena_bookings;
create policy "matatena_bookings_public_all"
  on public.matatena_bookings for all
  using (true)
  with check (true);

