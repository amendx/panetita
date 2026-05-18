-- Preferências por usuário. Hoje guarda só o modo de cálculo de lucro
-- (margem sobre o preço ou markup sobre o custo). Default markup.

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profit_calc_mode text not null default 'markup'
    check (profit_calc_mode in ('margin','markup')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy user_settings_owner on user_settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
