create table if not exists public.pedidos_notas_atendimentos (
  id uuid not null default gen_random_uuid(),
  pedido_id uuid not null,
  documento_id uuid null,
  faixa_inicial bigint not null,
  faixa_final bigint not null,
  quantidade_atendida integer not null,
  atendido_por uuid null,
  atendido_em timestamp without time zone not null default now(),
  observacao text null,
  constraint pedidos_notas_atendimentos_pkey primary key (id),
  constraint pedidos_notas_atendimentos_pedido_id_fkey
    foreign key (pedido_id) references public.pedidos_notas (id) on delete cascade,
  constraint pedidos_notas_atendimentos_documento_id_fkey
    foreign key (documento_id) references public.documentos_notas (id) on delete set null,
  constraint pedidos_notas_atendimentos_atendido_por_fkey
    foreign key (atendido_por) references auth.users (id) on delete set null
);

create index if not exists idx_pedidos_notas_atendimentos_pedido_id
  on public.pedidos_notas_atendimentos (pedido_id);

create index if not exists idx_pedidos_notas_atendimentos_documento_id
  on public.pedidos_notas_atendimentos (documento_id);
