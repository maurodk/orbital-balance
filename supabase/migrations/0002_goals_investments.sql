-- ============================================================================
-- Orbital Balance — Goals & Investments
-- Adds independent planning tables for financial goals, investments and
-- contribution history.
-- ============================================================================

create table if not exists public.investment_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'outro',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  deadline date,
  color text not null default '#D4AF7A',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid references public.investment_goals (id) on delete set null,
  name text not null,
  institution text not null,
  type text not null,
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid references public.investment_goals (id) on delete set null,
  investment_id uuid references public.investments (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  contribution_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_investment_goals_user on public.investment_goals (user_id, is_archived, created_at desc);
create index if not exists idx_investments_user_goal on public.investments (user_id, goal_id);
create index if not exists idx_contributions_user_goal_date on public.investment_contributions (user_id, goal_id, contribution_date desc);
create index if not exists idx_contributions_user_investment_date on public.investment_contributions (user_id, investment_id, contribution_date desc);

drop trigger if exists set_updated_at_investment_goals on public.investment_goals;
create trigger set_updated_at_investment_goals before update on public.investment_goals
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_investments on public.investments;
create trigger set_updated_at_investments before update on public.investments
  for each row execute function public.set_updated_at();

alter table public.investment_goals enable row level security;
alter table public.investments enable row level security;
alter table public.investment_contributions enable row level security;

drop policy if exists investment_goals_select_own on public.investment_goals;
create policy investment_goals_select_own on public.investment_goals
  for select using (auth.uid() = user_id);

drop policy if exists investment_goals_insert_own on public.investment_goals;
create policy investment_goals_insert_own on public.investment_goals
  for insert with check (auth.uid() = user_id);

drop policy if exists investment_goals_update_own on public.investment_goals;
create policy investment_goals_update_own on public.investment_goals
  for update using (auth.uid() = user_id);

drop policy if exists investment_goals_delete_own on public.investment_goals;
create policy investment_goals_delete_own on public.investment_goals
  for delete using (auth.uid() = user_id);

drop policy if exists investments_select_own on public.investments;
create policy investments_select_own on public.investments
  for select using (auth.uid() = user_id);

drop policy if exists investments_insert_own on public.investments;
create policy investments_insert_own on public.investments
  for insert with check (auth.uid() = user_id);

drop policy if exists investments_update_own on public.investments;
create policy investments_update_own on public.investments
  for update using (auth.uid() = user_id);

drop policy if exists investments_delete_own on public.investments;
create policy investments_delete_own on public.investments
  for delete using (auth.uid() = user_id);

drop policy if exists investment_contributions_select_own on public.investment_contributions;
create policy investment_contributions_select_own on public.investment_contributions
  for select using (auth.uid() = user_id);

drop policy if exists investment_contributions_insert_own on public.investment_contributions;
create policy investment_contributions_insert_own on public.investment_contributions
  for insert with check (auth.uid() = user_id);

drop policy if exists investment_contributions_delete_own on public.investment_contributions;
create policy investment_contributions_delete_own on public.investment_contributions
  for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table public.investment_goals;
alter publication supabase_realtime add table public.investments;
alter publication supabase_realtime add table public.investment_contributions;
