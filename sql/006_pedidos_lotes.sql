alter table public.pedidos_notas
  add column if not exists numero_pedido integer;

create unique index if not exists idx_pedidos_notas_transportadora_numero_pedido
  on public.pedidos_notas (transportadora_id, numero_pedido)
  where numero_pedido is not null;

create table if not exists public.lotes_notas (
  id uuid not null default gen_random_uuid(),
  transportadora_id integer not null,
  pedido_id uuid not null,
  numero_lote integer not null,
  faixa_inicial bigint not null,
  faixa_final bigint not null,
  quantidade_total integer not null,
  quantidade_disponivel integer not null,
  nf_sap_inicial bigint not null,
  nf_sap_final bigint null,
  status_lote text not null default 'aberto',
  criado_por uuid null,
  criado_em timestamp without time zone not null default now(),
  override_admin boolean not null default false,
  override_motivo text null,
  constraint lotes_notas_pkey primary key (id),
  constraint lotes_notas_pedido_id_fkey
    foreign key (pedido_id) references public.pedidos_notas (id) on delete cascade,
  constraint lotes_notas_transportadora_id_fkey
    foreign key (transportadora_id) references public.fornecedores (id) on delete cascade,
  constraint lotes_notas_criado_por_fkey
    foreign key (criado_por) references auth.users (id) on delete set null
);

create unique index if not exists idx_lotes_notas_transportadora_numero_lote
  on public.lotes_notas (transportadora_id, numero_lote);

create index if not exists idx_lotes_notas_pedido_id
  on public.lotes_notas (pedido_id);

create table if not exists public.lotes_notas_itens (
  id uuid not null default gen_random_uuid(),
  lote_id uuid not null,
  documento_id uuid not null,
  numero_nf bigint not null,
  criado_em timestamp without time zone not null default now(),
  constraint lotes_notas_itens_pkey primary key (id),
  constraint lotes_notas_itens_lote_id_fkey
    foreign key (lote_id) references public.lotes_notas (id) on delete cascade,
  constraint lotes_notas_itens_documento_id_fkey
    foreign key (documento_id) references public.documentos_notas (id) on delete cascade
);

create unique index if not exists idx_lotes_notas_itens_lote_documento
  on public.lotes_notas_itens (lote_id, documento_id);

create index if not exists idx_lotes_notas_itens_documento_id
  on public.lotes_notas_itens (documento_id);
