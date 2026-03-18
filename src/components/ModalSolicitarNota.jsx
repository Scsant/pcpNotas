import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { getTransportadoraConfig, transportadorasConfig } from "../lib/transportadoras";
import { formatSequenceNumber, getNextSequentialNumber } from "../lib/lotes";

const TIPO_PEDIDO_PADRAO = "normal";

const ModalSolicitarNota = ({ defaultTransportadoraId = null, perfil = null, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    quantidade_nfs: "",
    observacao: "",
  });
  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState(defaultTransportadoraId || "");
  const [fazendas, setFazendas] = useState([]);
  const [perfilAtual, setPerfilAtual] = useState(perfil);
  const [salvando, setSalvando] = useState(false);

  const isAdmin = (perfilAtual?.role || perfil?.role) === "admin";
  const transportadoraFixa = defaultTransportadoraId || (!isAdmin ? perfilAtual?.transportadora_id : null);
  const transportadoraResolvida = transportadoraFixa || transportadoraSelecionada;

  useEffect(() => {
    const carregarFazendas = async () => {
      const { data, error } = await supabase.from("fazendas").select("*").order("nome");
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar fazendas.");
      } else {
        setFazendas(data || []);
      }
    };

    const carregarPerfil = async () => {
      if (perfil) {
        setPerfilAtual(perfil);
        return;
      }

      const perfilStorage = JSON.parse(localStorage.getItem("perfil") || "null");
      if (perfilStorage) {
        setPerfilAtual(perfilStorage);
      }

      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setPerfilAtual((prev) => ({
          ...(prev || {}),
          id: data.user.id,
          user_id: data.user.id,
        }));
      }
    };

    carregarFazendas();
    carregarPerfil();
  }, [perfil]);

  const transportadoraAtual = useMemo(
    () => getTransportadoraConfig(transportadoraResolvida),
    [transportadoraResolvida]
  );

  const handleSubmit = async () => {
    if (!transportadoraResolvida || !form.quantidade_nfs || !fazendaSelecionada) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);

    try {
      const numeroPedido = await getNextSequentialNumber("pedidos_notas", Number(transportadoraResolvida), "numero_pedido");

      const payload = {
        transportadora_id: Number(transportadoraResolvida),
        fazenda_id: Number(fazendaSelecionada),
        user_id: perfilAtual?.user_id || perfilAtual?.id || null,
        quantidade_nfs: Number(form.quantidade_nfs),
        tipo_pedido: TIPO_PEDIDO_PADRAO,
        observacao: form.observacao,
        status: "pendente",
        numero_pedido: numeroPedido,
        atualizado_em: new Date().toISOString(),
      };

      const { error } = await supabase.from("pedidos_notas").insert([payload]);

      if (error) {
        console.error(error);
        toast.error("Erro ao solicitar nota.");
        setSalvando(false);
        return;
      }

      toast.success(`Solicitação enviada com sucesso. Pedido ${formatSequenceNumber(numeroPedido)}.`);
      setSalvando(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar o número do pedido.");
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-2 sm:p-4">
      <div className="glass-panel flex max-h-[calc(100vh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] sm:max-h-[calc(100vh-2rem)] sm:rounded-[28px]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-4 py-4 sm:px-5 sm:py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Novo pedido</p>
            <h2 className="section-title mt-2 text-2xl font-black">Solicitar notas</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Registre a quantidade necessária para o dia e deixe a demanda rastreável para o atendimento do PCP.
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid gap-4">
            {!transportadoraFixa && (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Transportadora</span>
                <select
                  value={transportadoraSelecionada}
                  onChange={(e) => setTransportadoraSelecionada(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                >
                  <option value="">Selecione a transportadora</option>
                  {transportadorasConfig.map((transportadora) => (
                    <option key={transportadora.id} value={transportadora.id}>
                      {transportadora.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {transportadoraAtual && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Pedido vinculado à transportadora <strong>{transportadoraAtual.nome}</strong>.
              </div>
            )}

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Fazenda</span>
              <select
                value={fazendaSelecionada}
                onChange={(e) => setFazendaSelecionada(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              >
                <option value="">Selecione a fazenda</option>
                {fazendas.map((fazenda) => (
                  <option key={fazenda.id} value={fazenda.id}>
                    {fazenda.nome} ({fazenda.estado})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Quantidade de NFs</span>
              <input
                type="number"
                min="1"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                value={form.quantidade_nfs}
                onChange={(e) => setForm((prev) => ({ ...prev, quantidade_nfs: e.target.value }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-600">Observação</span>
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                rows={3}
                value={form.observacao}
                onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-2xl bg-[#123b68] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f3259] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSubmit}
              disabled={salvando}
            >
              {salvando ? "Solicitando..." : "Solicitar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSolicitarNota;
