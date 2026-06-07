-- RSTGO Database Schema
-- Run this in Supabase SQL Editor

-- Restaurants table
create table restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  currency text default 'UAH',
  table_count int default 5,
  staff_pin text not null,
  plan text default 'starter' check (plan in ('starter','pro','enterprise')),
  active boolean default true,
  primary_color text default '#C17F3B',
  address text,
  phone text,
  created_at timestamptz default now()
);

-- Menu categories
create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  emoji text default '🍽',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Menu items
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  category_id uuid references menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  table_number int not null,
  items jsonb not null default '[]',
  status text default 'pending' check (status in ('pending','preparing','served','paid')),
  total numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);

-- Waiter calls
create table waiter_calls (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  table_number int not null,
  guest_name text default 'Гість',
  resolved boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table restaurants enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table waiter_calls enable row level security;

-- Policies: owners can manage their own restaurants
create policy "Owner can manage restaurant" on restaurants
  for all using (owner_id = auth.uid());

create policy "Owner can manage categories" on menu_categories
  for all using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owner can manage items" on menu_items
  for all using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Public can read active restaurants (for customer ordering)
create policy "Public can read restaurants" on restaurants
  for select using (active = true);

create policy "Public can read categories" on menu_categories
  for select using (true);

create policy "Public can read menu items" on menu_items
  for select using (available = true);

-- Public can insert orders (customers ordering)
create policy "Public can create orders" on orders
  for insert with check (true);

-- Owners can read/update their orders
create policy "Owner can read orders" on orders
  for select using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

create policy "Owner can update orders" on orders
  for update using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Waiter calls
create policy "Public can create waiter calls" on waiter_calls
  for insert with check (true);

create policy "Owner can manage waiter calls" on waiter_calls
  for all using (restaurant_id in (select id from restaurants where owner_id = auth.uid()));

-- Enable realtime for orders and waiter_calls
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table waiter_calls;
