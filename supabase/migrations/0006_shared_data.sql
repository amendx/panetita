-- Panetita é um app de uso interno de UMA empresa.
-- Qualquer usuário autenticado pode ler/escrever em qualquer linha.
-- Mantemos a coluna user_id como histórico de quem criou, mas RLS não filtra mais por dono.

do $$
declare t text;
begin
  for t in select unnest(array[
    'ingredients','recipes','recipe_sizes','recipe_size_ingredients',
    'combos','combo_items','customers','pets','addresses',
    'orders','order_items','deliveries','delivery_items','payments'
  ]) loop
    -- remove a policy antiga "<tabela>_owner"
    execute format('drop policy if exists %I on %I', t || '_owner', t);
    -- e a nova compartilhada (caso já exista de execução anterior)
    execute format('drop policy if exists %I on %I', t || '_shared', t);
    -- cria policy compartilhada
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_shared', t
    );
  end loop;
end $$;
