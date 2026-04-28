-- ============================================================================
-- Orbital Balance — Initial Schema (0001_init)
-- Single-run, idempotent migration. Run in Supabase SQL Editor.
-- Project: ddykmiblwpjdeerykmnk
-- ============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type public.transaction_type as enum ('expense', 'income');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('card', 'cash', 'pix', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recurrence_type as enum ('none', 'daily', 'weekly', 'monthly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.necessity_tag as enum ('necessary', 'unnecessary', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.category_scope as enum ('expense', 'income', 'both');
exception when duplicate_object then null; end $$;

-- Tables ----------------------------------------------------------------------

-- profiles: 1-to-1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  currency text not null default 'BRL',
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  icon text not null,
  type public.category_scope not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  description text not null,
  category_id uuid references public.categories (id) on delete set null,
  payment_method public.payment_method not null,
  date date not null,
  recurrence public.recurrence_type not null default 'none',
  recurrence_end_date date,
  tags text[],
  necessity_tag public.necessity_tag not null default 'pending',
  notes text,
  is_scheduled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- recurring_transactions: templates that generate new transactions
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  type public.transaction_type not null,
  category_id uuid references public.categories (id) on delete set null,
  payment_method public.payment_method not null,
  recurrence public.recurrence_type not null,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  last_generated date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- monthly_reports
create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2020 and 2100),
  total_income numeric(14, 2) not null default 0,
  total_expense numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  necessary_expenses numeric(14, 2) not null default 0,
  unnecessary_expenses numeric(14, 2) not null default 0,
  is_finalized boolean not null default false,
  insights text[],
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, year)
);

-- Indexes ---------------------------------------------------------------------
create index if not exists idx_transactions_user_date          on public.transactions (user_id, date desc);
create index if not exists idx_transactions_user_category      on public.transactions (user_id, category_id);
create index if not exists idx_transactions_user_type_date     on public.transactions (user_id, type, date desc);
create index if not exists idx_transactions_user_scheduled     on public.transactions (user_id, is_scheduled) where is_scheduled = true;
create index if not exists idx_categories_user                 on public.categories (user_id);
create index if not exists idx_monthly_reports_user_period     on public.monthly_reports (user_id, year desc, month desc);
create index if not exists idx_recurring_user_active           on public.recurring_transactions (user_id, is_active);

-- Function: set_updated_at ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_categories on public.categories;
create trigger set_updated_at_categories before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_transactions on public.transactions;
create trigger set_updated_at_transactions before update on public.transactions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_recurring on public.recurring_transactions;
create trigger set_updated_at_recurring before update on public.recurring_transactions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_reports on public.monthly_reports;
create trigger set_updated_at_reports before update on public.monthly_reports
  for each row execute function public.set_updated_at();

-- Function: handle_new_user (profile + default categories seed) --------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, v_name)
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color, icon, type, is_default) values
    (new.id, 'Alimentação',    '#F97316', 'UtensilsCrossed',  'expense', true),
    (new.id, 'Transporte',     '#3B82F6', 'Car',              'expense', true),
    (new.id, 'Saúde',          '#10B981', 'HeartPulse',       'expense', true),
    (new.id, 'Moradia',        '#8B5CF6', 'Home',             'expense', true),
    (new.id, 'Lazer',          '#EAB308', 'Gamepad2',         'expense', true),
    (new.id, 'Educação',       '#06B6D4', 'GraduationCap',    'expense', true),
    (new.id, 'Vestuário',      '#EC4899', 'Shirt',            'expense', true),
    (new.id, 'Investimentos',  '#D4AF7A', 'TrendingUp',       'both',    true),
    (new.id, 'Salário',        '#22C55E', 'Banknote',         'income',  true),
    (new.id, 'Outros',         '#94A3B8', 'MoreHorizontal',   'both',    true)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security ---------------------------------------------------------
alter table public.profiles                enable row level security;
alter table public.categories              enable row level security;
alter table public.transactions            enable row level security;
alter table public.recurring_transactions  enable row level security;
alter table public.monthly_reports         enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- categories
drop policy if exists categories_select_own on public.categories;
create policy categories_select_own on public.categories
  for select using (auth.uid() = user_id);

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own on public.categories
  for insert with check (auth.uid() = user_id);

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own on public.categories
  for update using (auth.uid() = user_id);

drop policy if exists categories_delete_non_default on public.categories;
create policy categories_delete_non_default on public.categories
  for delete using (auth.uid() = user_id and is_default = false);

-- transactions
drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists transactions_insert_own on public.transactions;
create policy transactions_insert_own on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists transactions_update_own on public.transactions;
create policy transactions_update_own on public.transactions
  for update using (auth.uid() = user_id);

drop policy if exists transactions_delete_own on public.transactions;
create policy transactions_delete_own on public.transactions
  for delete using (auth.uid() = user_id);

-- recurring_transactions
drop policy if exists recurring_select_own on public.recurring_transactions;
create policy recurring_select_own on public.recurring_transactions
  for select using (auth.uid() = user_id);

drop policy if exists recurring_insert_own on public.recurring_transactions;
create policy recurring_insert_own on public.recurring_transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists recurring_update_own on public.recurring_transactions;
create policy recurring_update_own on public.recurring_transactions
  for update using (auth.uid() = user_id);

drop policy if exists recurring_delete_own on public.recurring_transactions;
create policy recurring_delete_own on public.recurring_transactions
  for delete using (auth.uid() = user_id);

-- monthly_reports
drop policy if exists reports_select_own on public.monthly_reports;
create policy reports_select_own on public.monthly_reports
  for select using (auth.uid() = user_id);

drop policy if exists reports_insert_own on public.monthly_reports;
create policy reports_insert_own on public.monthly_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists reports_update_own on public.monthly_reports;
create policy reports_update_own on public.monthly_reports
  for update using (auth.uid() = user_id);

drop policy if exists reports_delete_own on public.monthly_reports;
create policy reports_delete_own on public.monthly_reports
  for delete using (auth.uid() = user_id);

-- Realtime (optional): enable publications for transactions/categories
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.monthly_reports;
