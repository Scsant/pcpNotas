import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlinePlus,
  HiOutlineTruck,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { formatSequenceNumber } from "../lib/lotes";
import { getTransportadoraConfig } from "../lib/transportadoras";
import ModalSolicitarNota from "./ModalSolicitarNota";
import PedidoAtendimentoModal from "./PedidoAtendimentoModal";

const formatDateTime = (value) => {
  if (!value) return "Sem data";
  return new Date(value).toLocaleString("pt-BR");
};

const getSolicitanteLabel = (pedido, perfisMap) => {
  const perfil = perfisMap.get(pedido.user_id);
  return (
    perfil?.nome ||
    perfil?.email ||
    perfil?.transportadora_nome ||
    (pedido.user_id ? `${pedido.user_id.slice(0, 8)}...` : "Sem vínculo")
  );
};

const PedidosQueue = ({
  perfil,
  transportadoraId = null,
  title = "Fila de Pedidos",
  description = "Acompanhe a demanda operacional e atenda os pedidos mais antigos primeiro.",
  compact = false,
  showCreateButton = true,
  allowAttend = false,
  reloadToken = 0,
  variant = "page",
}) => {
  const [pedidos, setPedidos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState({ status: "", busca: "" });
  const [mostrarModalSolicitacao, setMostrarModalSolicitacao] = useState(false);
  const [pedidoEmAtendimento, setPedidoEmAtendimento] = useState(null);
  const [perfisMap, setPerfisMap] = useState(new Map());
  const [fazendasMap, setFazendasMap] = useState(new Map());

  const isAdmin = perfil?.role === "admin";
  const transportadoraFixa = transportadoraId || (!isAdmin ? perfil?.transportadora_id : null);
  const transportadoraAtual = transportadoraFixa ? getTransportadoraConfig(transportadoraFixa) : null;
  const isModal = variant === "modal";

  const carregarDados = async () => {
    setCarregando(true);

    const pedidosQuery = supabase
      .from("pedidos_notas")
      .select("*")
      .order("status", { ascending: true })
      .order("criado_em", { ascending: true });

    const query = transportadoraFixa ? pedidosQuery.eq("transportadora_id", transportadoraFixa) : pedidosQuery;

    const [
      { data: pedidosData, error: pedidosError },
      { data: fazendasData, error: fazendasError },
      { data: perfisData, error: perfisError },
      { data: lotesData, error: lotesError },
    ] = await Promise.all([
      query,
      supabase.from("fazendas").select("*"),
      supabase.from("perfis").select("*"),
      supabase.from("lotes_notas").select("*").order("criado_em", { ascending: false }),
    ]);

    if (pedidosError) {
      console.error(pedidosError);
      toast.error("Erro ao carregar pedidos.");
      setPedidos([]);
      setLotes([]);
      setCarregando(false);
      return;
    }

    if (fazendasError) {
      console.error(fazendasError);
    }

    if (perfisError) {
      console.error(perfisError);
    }

    if (lotesError) {
      console.warn("Tabela de lotes ainda não disponível:", lotesError.message);
    }

    setPedidos(pedidosData || []);
    setFazendasMap(new Map((fazendasData || []).map((item) => [item.id, item])));
    setPerfisMap(new Map((perfisData || []).map((item) => [item.user_id, item])));
    setLotes((lotesData || []).filter((item) => !transportadoraFixa || item.transportadora_id === transportadoraFixa));
    setCarregando(false);
  };

  useEffect(() => {
    if (perfil) {
      carregarDados();
    }
  }, [perfil, transportadoraFixa, reloadToken]);

  const lotesMap = useMemo(() => {
    const map = new Map();
    lotes.forEach((item) => {
      if (!map.has(item.pedido_id)) {
        map.set(item.pedido_id, item);
      }
    });
    return map;
  }, [lotes]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .filter((pedido) => {
        const transportadora = getTransportadoraConfig(pedido.transportadora_id);
        const fazenda = fazendasMap.get(pedido.fazenda_id);
        const solicitante = getSolicitanteLabel(pedido, perfisMap);
        const busca = filtros.busca.trim().toLowerCase();

        const statusOk = filtros.status === "" || pedido.status === filtros.status;
        const buscaOk =
          busca === "" ||
          `pedido ${formatSequenceNumber(pedido.numero_pedido)}`.toLowerCase().includes(busca) ||
          transportadora?.nome?.toLowerCase().includes(busca) ||
          fazenda?.nome?.toLowerCase().includes(busca) ||
          solicitante.toLowerCase().includes(busca) ||
          pedido.observacao?.toLowerCase().includes(busca);

        return statusOk && buscaOk;
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "pendente" ? -1 : 1;
        }
        return new Date(a.criado_em) - new Date(b.criado_em);
      });
  }, [fazendasMap, filtros.busca, filtros.status, pedidos, perfisMap]);

  const pedidosPendentes = pedidosFiltrados.filter((item) => item.status === "pendente");
  const pedidosAtendidosRecentes = pedidosFiltrados
    .filter((item) => item.status === "atendido")
    .sort((a, b) => new Date(b.atualizado_em || b.criado_em) - new Date(a.atualizado_em || a.criado_em))
    .slice(0, isModal ? 8 : pedidosFiltrados.length);

  const resumo = useMemo(
    () => ({
      total: pedidosFiltrados.length,
      pendentes: pedidosPendentes.length,
      atendidos: pedidosFiltrados.filter((item) => item.status === "atendido").length,
    }),
    [pedidosFiltrados, pedidosPendentes.length]
  );

  const renderPedidoCard = (pedido) => {
    const transportadora = getTransportadoraConfig(pedido.transportadora_id);
    const fazenda = fazendasMap.get(pedido.fazenda_id);
    const solicitante = getSolicitanteLabel(pedido, perfisMap);
    const lote = lotesMap.get(pedido.id);
    const isPendente = pedido.status === "pendente";

    return (
      <article
        key={pedido.id}
        className={`rounded-[24px] border p-4 shadow-sm ${
          isPendente ? "border-amber-200 bg-white" : "border-emerald-200 bg-emerald-50/60"
        }`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className={`grid flex-1 gap-3 ${isModal ? "sm:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-5"}`}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Pedido</p>
              <p className="mt-1 text-sm font-black text-slate-800">#{formatSequenceNumber(pedido.numero_pedido)}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Transportadora</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                <HiOutlineTruck className="text-[#123b68]" />
                {transportadora?.nome || `ID ${pedido.transportadora_id}`}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Fazenda</p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {fazenda ? `${fazenda.nome} (${fazenda.estado})` : `ID ${pedido.fazenda_id}`}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Solicitante</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                <HiOutlineUserCircle className="text-[#123b68]" />
                {solicitante}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                  isPendente ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {pedido.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Quantidade: <strong>{pedido.quantidade_nfs}</strong>
            </div>
            {allowAttend && isAdmin && isPendente && (
              <button
                type="button"
                onClick={() => setPedidoEmAtendimento(pedido)}
                className="rounded-2xl bg-[#123b68] px-4 py-2 text-xs font-bold text-white"
              >
                Atender pedido
              </button>
            )}
          </div>
        </div>

        <div className={`mt-3 grid gap-3 ${isModal || compact ? "md:grid-cols-1" : "md:grid-cols-3"}`}>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Criado em</p>
            <p className="mt-1 font-medium">{formatDateTime(pedido.criado_em)}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Observação</p>
            <p className="mt-1 font-medium">{pedido.observacao || "Sem observações."}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Atendimento</p>
            {lote ? (
              <div className="space-y-1">
                <p className="font-medium">
                  Lote {formatSequenceNumber(lote.numero_lote)} | Faixa {lote.faixa_inicial} até {lote.faixa_final}
                </p>
                <p className="text-xs text-slate-500">
                  NF SAP inicial {lote.nf_sap_inicial} | Saldo do lote: {lote.quantidade_disponivel}
                </p>
                {lote.override_admin && (
                  <p className="text-xs font-semibold text-amber-700">
                    Liberação excepcional: {lote.override_motivo || "Sem motivo informado."}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 font-medium text-amber-700">Ainda não atendido.</p>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section className={`${isModal ? "space-y-5" : "glass-panel rounded-[32px] p-6 md:p-8"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {transportadoraAtual ? `Pedidos - ${transportadoraAtual.nome}` : "PCP Notas"}
          </p>
          <h2 className={`section-title mt-2 font-black ${isModal ? "text-2xl" : "text-3xl"}`}>{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={carregarDados}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
          >
            <HiOutlineArrowPath />
            Atualizar
          </button>
          {showCreateButton && (
            <button
              type="button"
              onClick={() => setMostrarModalSolicitacao(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#123b68] px-4 py-3 text-sm font-bold text-white"
            >
              <HiOutlinePlus />
              Solicitar notas
            </button>
          )}
        </div>
      </div>

      <div className={`mt-5 grid gap-4 ${isModal ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pedidos visíveis</p>
          <p className="mt-2 text-3xl font-black text-[#123b68]">{resumo.total}</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Pendentes</p>
          <p className="mt-2 text-3xl font-black text-amber-900">{resumo.pendentes}</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Atendidos</p>
          <p className="mt-2 text-3xl font-black text-emerald-900">{resumo.atendidos}</p>
        </div>
        {isModal && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Pendentes ficam primeiro. Atendidos recentes aparecem logo abaixo para consulta rápida.
          </div>
        )}
      </div>

      <div className={`mt-5 grid gap-4 ${isModal ? "sm:grid-cols-2" : "md:grid-cols-[0.8fr_0.8fr_1.4fr]"}`}>
        <select
          value={filtros.status}
          onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="atendido">Atendido</option>
        </select>

        <input
          type="text"
          value={filtros.busca}
          onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
          placeholder="Buscar por pedido, fazenda, solicitante ou observação"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
        />

        {!isModal && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Ordem padrão: pendentes mais antigos primeiro.
          </div>
        )}
      </div>

      <div className="mt-6 space-y-5">
        {carregando ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Carregando fila de pedidos...
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Pendentes</h3>
                <span className="text-xs font-semibold text-slate-500">{pedidosPendentes.length} pedido(s)</span>
              </div>
              {pedidosPendentes.length > 0 ? (
                pedidosPendentes.map(renderPedidoCard)
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  Nenhum pedido pendente.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Atendidos recentes</h3>
                <span className="text-xs font-semibold text-slate-500">{pedidosAtendidosRecentes.length} pedido(s)</span>
              </div>
              {pedidosAtendidosRecentes.length > 0 ? (
                pedidosAtendidosRecentes.map(renderPedidoCard)
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
                  Nenhum pedido atendido recente.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {mostrarModalSolicitacao && (
        <ModalSolicitarNota
          defaultTransportadoraId={transportadoraFixa}
          perfil={perfil}
          onClose={() => setMostrarModalSolicitacao(false)}
          onSuccess={carregarDados}
        />
      )}

      {pedidoEmAtendimento && (
        <PedidoAtendimentoModal
          pedido={pedidoEmAtendimento}
          perfil={perfil}
          transportadora={getTransportadoraConfig(pedidoEmAtendimento.transportadora_id)}
          onClose={() => setPedidoEmAtendimento(null)}
          onSuccess={carregarDados}
        />
      )}
    </section>
  );
};

export default PedidosQueue;
