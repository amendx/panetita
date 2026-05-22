-- Receitas "sob medida": vincular a um pet específico
-- Quando pet_id != null, a receita é considerada personalizada.
-- O vínculo é informativo: ainda permite usar a receita para outros pets,
-- mas a UI mostra um aviso no pedido se o pet do pedido for diferente.
-- ON DELETE SET NULL: se o pet for excluído, a receita vira genérica.

alter table recipes
  add column if not exists pet_id uuid references pets(id) on delete set null;

create index if not exists recipes_pet_id_idx on recipes(pet_id);
