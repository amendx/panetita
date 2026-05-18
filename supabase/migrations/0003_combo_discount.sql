-- Combos passam a usar desconto % sobre a soma das receitas
-- em vez de preço fixo manual.
alter table combos
  add column if not exists discount_pct numeric(5,2) not null default 0;

-- (fixed_price fica disponível como override opcional, mas a UI usa só discount_pct.)
