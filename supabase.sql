-- Rode no SQL Editor da Supabase uma única vez.
create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('visita', 'clique_checkout')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  dispositivo text
);

alter table public.eventos enable row level security;

-- O site pode só inserir. Ler os dados, só você pelo painel da Supabase.
drop policy if exists "site insere eventos" on public.eventos;
create policy "site insere eventos" on public.eventos
  for insert to anon
  with check (tipo in ('visita', 'clique_checkout'));

-- Resumo por origem (use no painel: select * from public.resumo_origem;)
create or replace view public.resumo_origem
with (security_invoker = true) as
select
  coalesce(utm_source, 'direto') as origem,
  count(*) filter (where tipo = 'visita') as visitas,
  count(*) filter (where tipo = 'clique_checkout') as cliques_checkout,
  round(100.0 * count(*) filter (where tipo = 'clique_checkout')
        / nullif(count(*) filter (where tipo = 'visita'), 0), 1) as taxa_clique_pct
from public.eventos
group by 1
order by visitas desc;
