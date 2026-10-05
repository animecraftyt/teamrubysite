create table if not exists public.player_profiles (
    user_id uuid primary key references auth.users (id) on delete cascade,
    username text not null unique check (username ~ '^[a-zA-Z0-9_]{3,16}$'),
    created_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;
revoke all on table public.player_profiles from anon, authenticated;

create table if not exists public.player_inventory (
    user_id uuid primary key references auth.users (id) on delete cascade,
    box_bucks integer not null default 0 check (box_bucks >= 0),
    slow_potions integer not null default 0 check (slow_potions >= 0),
    revives integer not null default 0 check (revives >= 0),
    updated_at timestamptz not null default now()
);

alter table public.player_inventory enable row level security;
revoke all on table public.player_inventory from anon, authenticated;
grant select, insert, update on table public.player_inventory to authenticated;

create policy "Players can read their own inventory"
on public.player_inventory for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Players can create their own inventory"
on public.player_inventory for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Players can update their own inventory"
on public.player_inventory for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.handle_team_ruby_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.player_profiles (user_id, username)
    values (new.id, lower(new.raw_user_meta_data ->> 'username'));
    return new;
end;
$$;

revoke execute on function public.handle_team_ruby_user_created() from public, anon, authenticated;

drop trigger if exists on_team_ruby_user_created on auth.users;
create trigger on_team_ruby_user_created
after insert on auth.users
for each row execute function public.handle_team_ruby_user_created();
