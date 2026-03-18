-- SQL DDL to create notes extraction table for Supabase
-- Run this in your Supabase SQL editor or psql

CREATE TABLE IF NOT EXISTS notas_extracao (
  id uuid PRIMARY KEY,
  documento_id uuid REFERENCES documentos_notas(id) ON DELETE CASCADE,
  nome_arquivo text,
  numero_nf bigint,
  remessa text,
  ordem text,
  pedido text,
  fatura text,
  chave_acesso varchar(44),
  nome_fazenda text,
  raw_text text,
  extraido_em timestamptz DEFAULT now()
);

-- optional index
CREATE INDEX IF NOT EXISTS idx_notas_extracao_numero_nf ON notas_extracao(numero_nf);
CREATE INDEX IF NOT EXISTS idx_notas_extracao_chave ON notas_extracao(chave_acesso);
