import { supabase } from "../supabaseClient";

export const formatSequenceNumber = (value) => String(Number(value) || 0).padStart(4, "0");

export const getNextSequentialNumber = async (table, transportadoraId, columnName) => {
  const { data, error } = await supabase
    .from(table)
    .select(columnName)
    .eq("transportadora_id", transportadoraId)
    .not(columnName, "is", null)
    .order(columnName, { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const current = Number(data?.[0]?.[columnName] || 0);
  return current + 1;
};

export const syncLoteDisponibilidade = async (loteId) => {
  if (!loteId) return null;

  const { data: itens, error: itensError } = await supabase
    .from("lotes_notas_itens")
    .select("documento_id")
    .eq("lote_id", loteId);

  if (itensError) throw itensError;

  const documentoIds = (itens || []).map((item) => item.documento_id);
  const quantidadeTotal = documentoIds.length;

  if (quantidadeTotal === 0) {
    const { error: updateError } = await supabase
      .from("lotes_notas")
      .update({
        quantidade_total: 0,
        quantidade_disponivel: 0,
        status_lote: "consumido",
      })
      .eq("id", loteId);

    if (updateError) throw updateError;
    return { quantidadeTotal: 0, quantidadeDisponivel: 0, statusLote: "consumido" };
  }

  const { data: documentos, error: docsError } = await supabase
    .from("documentos_notas")
    .select("id, status")
    .in("id", documentoIds);

  if (docsError) throw docsError;

  const quantidadeDisponivel = (documentos || []).filter((doc) => doc.status === "pendente").length;
  const statusLote = quantidadeDisponivel > 0 ? "aberto" : "consumido";

  const { error: updateError } = await supabase
    .from("lotes_notas")
    .update({
      quantidade_total: quantidadeTotal,
      quantidade_disponivel: quantidadeDisponivel,
      status_lote: statusLote,
    })
    .eq("id", loteId);

  if (updateError) throw updateError;

  return { quantidadeTotal, quantidadeDisponivel, statusLote };
};

export const syncLotesByDocumento = async (documentoId) => {
  if (!documentoId) return;

  const { data: itens, error } = await supabase
    .from("lotes_notas_itens")
    .select("lote_id")
    .eq("documento_id", documentoId);

  if (error) throw error;

  for (const item of itens || []) {
    await syncLoteDisponibilidade(item.lote_id);
  }
};
