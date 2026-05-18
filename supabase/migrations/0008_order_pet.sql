-- O pedido eh do tutor (customer), mas a comida eh pro pet.
-- Coluna opcional para registrar de qual pet aquele pedido eh.
alter table orders
  add column if not exists pet_id uuid references pets(id) on delete set null;

create index if not exists orders_pet_id_idx on orders(pet_id);
