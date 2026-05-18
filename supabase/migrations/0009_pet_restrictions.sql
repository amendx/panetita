-- Campo para restricoes alimentares / observacoes importantes do pet
-- (que precisam aparecer no momento do pedido)
alter table pets
  add column if not exists restrictions text;
