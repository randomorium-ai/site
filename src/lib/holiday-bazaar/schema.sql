-- ─────────────────────────────────────────────────────────────────────────────
-- Holiday Bazaar — Supabase schema
-- Run this in the Supabase SQL editor for your holiday-bazaar project.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── trips ────────────────────────────────────────────────────────────────────

create table if not exists trips (
  id          text primary key,                      -- 8-char nanoid slug
  name        text not null,
  created_by  uuid not null,                         -- member_id of organiser
  created_at  timestamptz not null default now(),
  status      text not null default 'collecting'     -- collecting | searching | booked
);

-- ── members ──────────────────────────────────────────────────────────────────

create table if not exists members (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             text not null references trips(id) on delete cascade,
  name                text not null,
  al_budget           integer,                       -- days willing to use
  departure_airports  text[] not null default '{}',  -- IATA codes, max 2
  account_id          uuid,                          -- null for guests
  joined_at           timestamptz not null default now()
);

-- ── date_ranges ───────────────────────────────────────────────────────────────

create table if not exists date_ranges (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  constraint date_ranges_order check (end_date >= start_date)
);

-- ── indexes ───────────────────────────────────────────────────────────────────

create index if not exists members_trip_id_idx      on members(trip_id);
create index if not exists date_ranges_member_id_idx on date_ranges(member_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- All reads are public (anyone with the link can view the trip).
-- Writes are open for now (v1 — no auth required to join or create).
-- Tighten these policies when optional account auth is added in a later phase.

alter table trips       enable row level security;
alter table members     enable row level security;
alter table date_ranges enable row level security;

-- trips: anyone can read, anyone can insert
create policy "trips_select" on trips for select using (true);
create policy "trips_insert" on trips for insert with check (true);
create policy "trips_update" on trips for update using (true);

-- members: anyone can read members for a trip, anyone can insert
create policy "members_select" on members for select using (true);
create policy "members_insert" on members for insert with check (true);
create policy "members_update" on members for update using (true);

-- date_ranges: anyone can read, anyone can insert/update/delete their own
create policy "date_ranges_select" on date_ranges for select using (true);
create policy "date_ranges_insert" on date_ranges for insert with check (true);
create policy "date_ranges_update" on date_ranges for update using (true);
create policy "date_ranges_delete" on date_ranges for delete using (true);
