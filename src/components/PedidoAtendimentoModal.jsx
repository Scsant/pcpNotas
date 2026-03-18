import { useEffect, useMemo, useState } from "react";
import { HiOutlineExclamationTriangle, HiOutlineQueueList } from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { formatSequenceNumber, getNextSequentialNumber, syncLoteDisponibilidade } from "../lib/lotes";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("pt-BR") : "Sem data");

const PedidoAtendimentoModal = ({ pedido, transportadora, perfil, onClose, onSuccess }) => {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [notasDisponiveis, setNotasDisponiveis] = useState([]);
  const [loteAberto, setLoteAberto] = useState(null);
  const [overrideAdmin, setOverrideAdmin] = useState(false);
  const [overrideMotivo, setOverrideMotivo] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);

      const [{ data: notasData, error: notasError }, { data: lotesData, error: lotesError }] = await Promise.all([
        supabase
          .from("documentos_notas")
          .select("id, numero_nf, data_envio, status, cte, placa, observacao, transportadora_id")
          .eq("transportadora_id", transportadora.id)
          .eq("status", "pendente")
          .order("data_envio", { ascending: true })
          .order("numero_nf", { ascending: true }),
        supabase
          .from("lotes_notas")
          .select("*")
          .eq("transportadora_id", transportadora.id)
          .eq("status_lote", "aberto")
          .order("numero_lote", { ascending: false }),
      ]);

      if (notasError) {
        console.error(notasError);
        toast.error("Erro ao buscar notas disponíveis.");
        setNotasDisponiveis([]);
      } else {
        setNotasDisponiveis(notasData || []);
      }

      if (lotesError) {
        console.error(lotesError);
        setLoteAberto(null);
      } else if (lotesData?.length) {
        const lote = lotesData[0];
        try {
          const syncResult = await syncLoteDisponibilidade(lote.id);
          setLoteAberto({
            ...lote,
            quantidade_disponivel: syncResult.quantidadeDisponivel,
            status_lote: syncResult.statusLote,
          });
        } catch (syncError) {
          console.error(syncError);
          setLoteAberto(lote);
        }
      } else {
        setLoteAberto(null);
      }

      setCarregando(false);
    };

    carregarDados();
  }, [transportadora.id]);

  const quantidadeSolicitada = Number(pedido.quantidade_nfs) || 0;
  const faixaObrigatoria = useMemo(
    () => notasDisponiveis.slice(0, quantidadeSolicitada),
    [notasDisponiveis, quantidadeSolicitada]
  );
  const temQuantidadeSuficiente = faixaObrigatoria.length === quantidadeSolicitada && quantidadeSolicitada > 0;
  const faixaInicial = faixaObrigatoria[0]?.numero_nf ?? null;
  const faixaFinal = faixaObrigatoria[faixaObrigatoria.length - 1]?.numero_nf ?? null;
  const existeBloqueioLote = Boolean(loteAberto && Number(loteAberto.quantidade_disponivel) > 0);
  const podeForcar = perfil?.role === "admin";

  const atenderPedido = async () => {
    if (!temQuantidadeSuficiente) {
      toast.error("Não há notas pendentes suficientes para atender este pedido.");
      return;
    }

    if (existeBloqueioLote && !overrideAdmin) {
      toast.error("Existe um lote anterior em aberto com saldo disponível.");
      return;
    }

    if (existeBloqueioLote && overrideAdmin && !overrideMotivo.trim()) {
      toast.error("Informe o motivo da liberação excepcional.");
      return;
    }

    setSalvando(true);

    try {
      const numeroLote = await getNextSequentialNumber("lotes_notas", transportadora.id, "numero_lote");
      const nfSapInicial = faixaInicial;
      const nfSapFinal = faixaFinal;

      const { data: loteCriado, error: loteError } = await supabase
        .from("lotes_notas")
        .insert([
          {
            transportadora_id: transportadora.id,
            pedido_id: pedido.id,
            numero_lote: numeroLote,
            faixa_inicial: faixaInicial,
            faixa_final: faixaFinal,
            quantidade_total: quantidadeSolicitada,
            quantidade_disponivel: quantidadeSolicitada,
            nf_sap_inicial: nfSapInicial,
            nf_sap_final: nfSapFinal,
            status_lote: "aberto",
            criado_por: perfil?.user_id || perfil?.id || null,
            override_admin: overrideAdmin,
            override_motivo: overrideAdmin ? overrideMotivo.trim() : null,
          },
        ])
        .select("*")
        .single();

      if (loteError) {
        throw loteError;
      }

      const itensPayload = faixaObrigatoria.map((nota) => ({
        lote_id: loteCriado.id,
        documento_id: nota.id,
        numero_nf: nota.numero_nf,
      }));

      const { error: itensError } = await supabase.from("lotes_notas_itens").insert(itensPayload);
      if (itensError) {
        throw itensError;
      }

      await syncLoteDisponibilidade(loteCriado.id);

      const { error: pedidoError } = await supabase
        .from("pedidos_notas")
        .update({
          status: "atendido",
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", pedido.id);

      if (pedidoError) {
        throw pedidoError;
      }

      toast.success(
        `Pedido ${formatSequenceNumber(pedido.numero_pedido)} atendido com o lote ${formatSequenceNumber(numeroLote)}.`
      );
      setSalvando(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar o lote do pedido.");
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-2 sm:p-4">
      <div className="glass-panel flex max-h-[calc(100vh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] sm:max-h-[calc(100vh-2rem)] sm:rounded-[32px]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-4 py-4 sm:px-6 sm:py-6 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Atendimento obrigatório</p>
            <h2 className="section-title mt-2 text-3xl font-black">Atender pedido</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              O lote usa obrigatoriamente as notas mais antigas disponíveis. Novo lote só abre se não houver saldo anterior, salvo liberação do admin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Fechar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 md:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pedido</p>
              <p className="mt-2 text-lg font-black text-slate-800">
                Pedido {formatSequenceNumber(pedido.numero_pedido)}
              </p>
              <p className="mt-1 text-sm text-slate-600">{transportadora.nome}</p>
              <p className="mt-1 text-sm text-slate-600">Quantidade solicitada: {quantidadeSolicitada}</p>
              <p className="mt-1 text-sm text-slate-600">Criado em: {formatDate(pedido.criado_em)}</p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                <HiOutlineExclamationTriangle />
                Regra contratual
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                Enquanto houver saldo em lote anterior, o próximo lote fica bloqueado. As NFs mais antigas são sempre priorizadas.
              </p>
            </div>
          </div>

          {existeBloqueioLote && (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-bold text-rose-900">
                Lote {formatSequenceNumber(loteAberto.numero_lote)} ainda está aberto com saldo de {loteAberto.quantidade_disponivel} NF(s).
              </p>
              <p className="mt-2 text-sm text-rose-800">
                O lote seguinte só pode ser liberado com aval do admin Bracell.
              </p>

              {podeForcar && (
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 text-sm font-semibold text-rose-900">
                    <input
                      type="checkbox"
                      checked={overrideAdmin}
                      onChange={(e) => setOverrideAdmin(e.target.checked)}
                    />
                    Liberar excepcionalmente o novo lote
                  </label>

                  {overrideAdmin && (
                    <textarea
                      rows={3}
                      value={overrideMotivo}
                      onChange={(e) => setOverrideMotivo(e.target.value)}
                      className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                      placeholder="Justifique a liberação excepcional do próximo lote"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
              <HiOutlineQueueList />
              Preview do lote a ser criado
            </div>

            {carregando ? (
              <p className="mt-4 text-sm text-slate-500">Carregando notas disponíveis...</p>
            ) : temQuantidadeSuficiente ? (
              <>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Próximo lote</p>
                    <p className="mt-1 font-black text-slate-800">Lote em sequência</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Faixa</p>
                    <p className="mt-1 font-black text-slate-800">
                      {faixaInicial} até {faixaFinal}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">NF SAP inicial</p>
                    <p className="mt-1 font-black text-slate-800">{faixaInicial}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quantidade</p>
                    <p className="mt-1 font-black text-slate-800">{quantidadeSolicitada}</p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-slate-500">
                      <tr>
                        <th className="px-3 py-2">NF</th>
                        <th className="px-3 py-2">Data de envio</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faixaObrigatoria.map((nota) => (
                        <tr key={nota.id} className="border-t border-slate-200">
                          <td className="px-3 py-2 font-semibold text-slate-800">{nota.numero_nf}</td>
                          <td className="px-3 py-2 text-slate-600">{formatDate(nota.data_envio)}</td>
                          <td className="px-3 py-2 text-slate-600">{nota.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                Há apenas <strong>{notasDisponiveis.length}</strong> notas pendentes disponíveis para esta transportadora.
                O pedido exige <strong>{quantidadeSolicitada}</strong> notas.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={atenderPedido}
              disabled={salvando || !temQuantidadeSuficiente || (existeBloqueioLote && !overrideAdmin)}
              className="rounded-2xl bg-[#123b68] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f3259] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Gerando lote..." : "Confirmar atendimento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedidoAtendimentoModal;
