-- Investment allocations let one investment fund multiple goals with
-- percentage-based distribution.

create table if not exists public.investment_goal_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  investment_id uuid not null references public.investments (id) on delete cascade,
  goal_id uuid not null references public.investment_goals (id) on delete cascade,
  percentage numeric(5, 2) not null check (percentage >= 0 and percentage <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (investment_id, goal_id)
);

insert into public.investment_goal_allocations (user_id, investment_id, goal_id, percentage)
select user_id, id, goal_id, 100
from public.investments
where goal_id is not null
on conflict (investment_id, goal_id) do nothing;

create index if not exists idx_investment_allocations_user_investment
  on public.investment_goal_allocations (user_id, investment_id);

create index if not exists idx_investment_allocations_user_goal
  on public.investment_goal_allocations (user_id, goal_id);

drop trigger if exists set_updated_at_investment_goal_allocations on public.investment_goal_allocations;
create trigger set_updated_at_investment_goal_allocations before update on public.investment_goal_allocations
  for each row execute function public.set_updated_at();

alter table public.investment_goal_allocations enable row level security;

drop policy if exists investment_allocations_select_own on public.investment_goal_allocations;
create policy investment_allocations_select_own on public.investment_goal_allocations
  for select using (auth.uid() = user_id);

drop policy if exists investment_allocations_insert_own on public.investment_goal_allocations;
create policy investment_allocations_insert_own on public.investment_goal_allocations
  for insert with check (auth.uid() = user_id);

drop policy if exists investment_allocations_update_own on public.investment_goal_allocations;
create policy investment_allocations_update_own on public.investment_goal_allocations
  for update using (auth.uid() = user_id);

drop policy if exists investment_allocations_delete_own on public.investment_goal_allocations;
create policy investment_allocations_delete_own on public.investment_goal_allocations
  for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table public.investment_goal_allocations;
