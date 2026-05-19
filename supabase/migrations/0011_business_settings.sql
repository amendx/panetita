-- Configuracoes do negocio: custos fixos mensais + reserva para manutencao
-- Singleton: 1 linha por business (compartilhada entre usuarios autenticados)

create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  monthly_rent numeric(12,2) not null default 0,
  monthly_energy numeric(12,2) not null default 0,
  monthly_marketing numeric(12,2) not null default 0,
  monthly_mei numeric(12,2) not null default 0,
  -- % do lucro bruto que vai para o fundo de reserva (manutencao de equipamentos)
  reserve_pct numeric(5,2) not null default 3,
  -- Quantas panelinhas voce estima vender por mes (para diluir o fixo)
  estimated_units_per_month integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table business_settings enable row level security;

drop policy if exists business_settings_shared on business_settings;
create policy business_settings_shared on business_settings
  for all to authenticated
  using (true) with check (true);

-- Cria a unica linha (singleton) se ainda nao existe
insert into business_settings (id)
select gen_random_uuid()
where not exists (select 1 from business_settings);
