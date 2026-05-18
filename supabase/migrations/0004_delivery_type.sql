-- Tipo de entrega por entrega (Uber/99 pago pelo cliente OU retirada na loja)
alter table deliveries
  add column if not exists delivery_type text not null default 'uber_99'
    check (delivery_type in ('uber_99', 'pickup'));
