-- Adiciona campo "conheceu por onde" (source) em customers
alter table customers add column if not exists source text;
