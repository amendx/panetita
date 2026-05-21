-- % de perda por ingrediente (cocção, descongelamento, descarte de aparas)
-- Quando uma receita usa N do ingrediente, na pratica precisamos comprar N x (1 + loss_pct/100).
-- Tambem afeta o calculo do custo e a lista de compras.

alter table ingredients
  add column if not exists loss_pct numeric(5,2) not null default 0;
