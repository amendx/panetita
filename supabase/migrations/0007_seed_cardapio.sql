-- ============================================================
-- 1. Adiciona preço unitário mensal (com desconto) nos tamanhos
-- ============================================================
alter table recipe_sizes
  add column if not exists fixed_price_monthly numeric(12,2);

-- ============================================================
-- 2. Seed do cardápio oficial da Panelinha da Tita
--    (apenas insere se ainda não existir; pode rodar várias vezes)
-- ============================================================
do $$
declare
  v_user_id uuid;
  v_frango  uuid;
  v_carne   uuid;
  v_suino   uuid;
begin
  -- Pega qualquer usuário autenticado (RLS é shared, então não importa qual)
  select id into v_user_id from auth.users order by created_at limit 1;
  if v_user_id is null then
    raise exception 'Crie um usuário em Authentication > Users antes de rodar este seed';
  end if;

  -- ---------- INGREDIENTES (não duplica se já existir com mesmo nome) ----------
  with ing(name, unit) as (
    values
      -- Comuns
      ('Azeite',                  'ml'),
      ('Sal',                     'g'),
      ('Suplementação',           'g'),
      -- Frango
      ('Filé de peito de frango', 'kg'),
      ('Moela de frango',         'kg'),
      ('Fígado de frango',        'kg'),
      ('Batata doce',             'kg'),
      ('Couve manteiga',          'kg'),
      ('Abobrinha',               'kg'),
      ('Cenoura',                 'kg'),
      ('Coentro',                 'kg'),
      -- Carne
      ('Músculo bovino',          'kg'),
      ('Coração bovino',          'kg'),
      ('Fígado bovino',           'kg'),
      ('Arroz parboilizado',      'kg'),
      ('Brócolis',                'kg'),
      ('Beterraba',               'kg'),
      ('Chuchu',                  'kg'),
      ('Gengibre',                'kg')
  )
  insert into ingredients (user_id, name, unit, price_per_unit, stock_quantity)
  select v_user_id, ing.name, ing.unit, 0, 0
  from ing
  where not exists (
    select 1 from ingredients i where i.name = ing.name
  );

  -- ---------- RECEITAS ----------
  if not exists (select 1 from recipes where name = 'Panelinha de Frango') then
    insert into recipes (user_id, name, description)
    values (v_user_id, 'Panelinha de Frango',
            'Filé de peito de frango, moela, fígado, batata-doce e legumes')
    returning id into v_frango;
  else
    select id into v_frango from recipes where name = 'Panelinha de Frango' limit 1;
  end if;

  if not exists (select 1 from recipes where name = 'Panelinha de Carne') then
    insert into recipes (user_id, name, description)
    values (v_user_id, 'Panelinha de Carne',
            'Músculo bovino, coração, fígado, arroz parboilizado e legumes')
    returning id into v_carne;
  else
    select id into v_carne from recipes where name = 'Panelinha de Carne' limit 1;
  end if;

  if not exists (select 1 from recipes where name = 'Panelinha de Suíno') then
    insert into recipes (user_id, name, description)
    values (v_user_id, 'Panelinha de Suíno',
            'Receita de suíno (ingredientes a confirmar)')
    returning id into v_suino;
  else
    select id into v_suino from recipes where name = 'Panelinha de Suíno' limit 1;
  end if;

  -- ---------- TAMANHOS ----------
  -- Preço unitário = preço do plano / nº de unidades (7 semanal, 28 mensal)
  -- Frango
  insert into recipe_sizes (user_id, recipe_id, size_label, fixed_price, fixed_price_monthly)
  select v_user_id, v_frango, t.label, t.weekly, t.monthly
  from (values
    ('Miniatura I — 160g',  8.00,  7.27),
    ('Miniatura II — 200g', 9.50,  8.59),
    ('Pequeno I — 250g',   10.93,  9.91),
    ('Pequeno II — 350g',  14.21, 12.88),
    ('Médio I — 450g',     17.07, 15.52),
    ('Médio II — 600g',    21.79, 19.80)
  ) as t(label, weekly, monthly)
  where not exists (
    select 1 from recipe_sizes rs
    where rs.recipe_id = v_frango and rs.size_label = t.label
  );

  -- Carne
  insert into recipe_sizes (user_id, recipe_id, size_label, fixed_price, fixed_price_monthly)
  select v_user_id, v_carne, t.label, t.weekly, t.monthly
  from (values
    ('Miniatura I — 160g',  8.71,  7.93),
    ('Miniatura II — 200g', 10.56,  9.57),
    ('Pequeno I — 250g',   12.64, 11.23),
    ('Pequeno II — 350g',  16.21, 14.70),
    ('Médio I — 450g',     19.27, 17.50),
    ('Médio II — 600g',    24.36, 22.11)
  ) as t(label, weekly, monthly)
  where not exists (
    select 1 from recipe_sizes rs
    where rs.recipe_id = v_carne and rs.size_label = t.label
  );

  -- Suíno
  insert into recipe_sizes (user_id, recipe_id, size_label, fixed_price, fixed_price_monthly)
  select v_user_id, v_suino, t.label, t.weekly, t.monthly
  from (values
    ('Miniatura I — 160g',  8.41,  7.59),
    ('Miniatura II — 200g', 9.84,  8.88),
    ('Pequeno I — 250g',   11.93, 10.75),
    ('Pequeno II — 350g',  15.70, 14.14),
    ('Médio I — 450g',     19.21, 17.30),
    ('Médio II — 600g',    24.56, 22.10)
  ) as t(label, weekly, monthly)
  where not exists (
    select 1 from recipe_sizes rs
    where rs.recipe_id = v_suino and rs.size_label = t.label
  );

  -- ---------- COMPOSIÇÃO (1g placeholder por ingrediente em cada tamanho) ----------
  -- A usuária ajusta as quantidades reais via UI.

  -- Frango: liga TODOS os ingredientes da receita Frango a TODOS os tamanhos da receita Frango.
  insert into recipe_size_ingredients (user_id, recipe_size_id, ingredient_id, quantity, unit)
  select v_user_id, rs.id, i.id, 1, 'g'
  from recipe_sizes rs
  cross join ingredients i
  where rs.recipe_id = v_frango
    and i.name in (
      'Filé de peito de frango', 'Moela de frango', 'Fígado de frango',
      'Batata doce', 'Couve manteiga', 'Abobrinha', 'Cenoura', 'Coentro',
      'Azeite', 'Sal', 'Suplementação'
    )
    and not exists (
      select 1 from recipe_size_ingredients rsi
      where rsi.recipe_size_id = rs.id and rsi.ingredient_id = i.id
    );

  -- Carne
  insert into recipe_size_ingredients (user_id, recipe_size_id, ingredient_id, quantity, unit)
  select v_user_id, rs.id, i.id, 1, 'g'
  from recipe_sizes rs
  cross join ingredients i
  where rs.recipe_id = v_carne
    and i.name in (
      'Músculo bovino', 'Coração bovino', 'Fígado bovino',
      'Arroz parboilizado', 'Brócolis', 'Beterraba', 'Chuchu', 'Gengibre',
      'Azeite', 'Sal', 'Suplementação'
    )
    and not exists (
      select 1 from recipe_size_ingredients rsi
      where rsi.recipe_size_id = rs.id and rsi.ingredient_id = i.id
    );

  -- Suíno: sem ingredientes ainda (aguardando confirmação dos itens)

end $$;
