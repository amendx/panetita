-- Panetita initial schema
-- Run in Supabase SQL Editor. All tables scoped by user_id with RLS.

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('g','kg','un','ml','l')),
  price_per_unit numeric(12,4) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index on ingredients(user_id);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  photo_url text,
  created_at timestamptz not null default now()
);
create index on recipes(user_id);

create table recipe_sizes (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  size_label text not null,
  fixed_price numeric(12,2),
  notes text
);
create index on recipe_sizes(recipe_id);
create index on recipe_sizes(user_id);

create table recipe_size_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_size_id uuid not null references recipe_sizes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity numeric(12,4) not null,
  unit text not null check (unit in ('g','kg','un','ml','l'))
);
create index on recipe_size_ingredients(recipe_size_id);
create index on recipe_size_ingredients(user_id);

create table combos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  fixed_price numeric(12,2),
  created_at timestamptz not null default now()
);
create index on combos(user_id);

create table combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references combos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_size_id uuid not null references recipe_sizes(id) on delete restrict,
  quantity integer not null check (quantity > 0)
);
create index on combo_items(combo_id);
create index on combo_items(user_id);

create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);
create index on customers(user_id);

create table pets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  weight_kg numeric(6,2),
  breed text,
  notes text,
  photo_url text
);
create index on pets(customer_id);
create index on pets(user_id);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  street text not null,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip text,
  is_default boolean not null default false
);
create index on addresses(customer_id);
create index on addresses(user_id);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete restrict,
  address_id uuid references addresses(id) on delete set null,
  recurrence text not null check (recurrence in ('single','weekly','biweekly','monthly','custom')),
  pricing_strategy text not null check (pricing_strategy in ('fixed','fixed_editable','margin')),
  margin_pct numeric(6,2),
  total_price numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  notes text,
  status text not null default 'confirmed' check (status in ('draft','confirmed','delivered','cancelled')),
  created_at timestamptz not null default now()
);
create index on orders(user_id);
create index on orders(customer_id);
create index on orders(created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_size_id uuid references recipe_sizes(id) on delete restrict,
  combo_id uuid references combos(id) on delete restrict,
  quantity numeric(12,4) not null,
  measure_type text not null check (measure_type in ('portion','weight')),
  measure_unit text not null check (measure_unit in ('un','g','kg')),
  unit_price numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  line_cost numeric(12,2) not null default 0,
  check ((recipe_size_id is not null) or (combo_id is not null))
);
create index on order_items(order_id);
create index on order_items(user_id);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  address_id uuid references addresses(id) on delete set null,
  scheduled_date date not null,
  scheduled_time time,
  status text not null default 'scheduled' check (status in ('scheduled','delivered','cancelled')),
  delivered_at timestamptz,
  notes text
);
create index on deliveries(order_id);
create index on deliveries(user_id);
create index on deliveries(scheduled_date);

create table delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quantity numeric(12,4) not null
);
create index on delivery_items(delivery_id);
create index on delivery_items(order_item_id);
create index on delivery_items(user_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null check (method in ('pix','cash','card','transfer','other')),
  paid_at timestamptz,
  due_date date,
  status text not null default 'pending' check (status in ('pending','paid','overdue')),
  notes text
);
create index on payments(order_id);
create index on payments(user_id);
create index on payments(due_date);

-- ============================================================
-- RLS POLICIES
-- ============================================================

do $$
declare t text;
begin
  for t in select unnest(array[
    'ingredients','recipes','recipe_sizes','recipe_size_ingredients',
    'combos','combo_items','customers','pets','addresses',
    'orders','order_items','deliveries','delivery_items','payments'
  ]) loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_owner', t
    );
  end loop;
end $$;
