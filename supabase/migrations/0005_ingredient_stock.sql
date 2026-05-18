-- Controle de estoque por ingrediente (quantidade na unidade base do ingrediente).
alter table ingredients
  add column if not exists stock_quantity numeric(14,4) not null default 0;
