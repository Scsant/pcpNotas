import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaDownload, FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { syncLotesByDocumento } from "../lib/lotes";
import GlobalHeader from "./GlobalHeader";
import PainelHeader from "./PainelHeader";
import BotaoCancelarNotas from "./BotaoCancelarNotas";
import NotaLinha from "./NotaLinha";
import PedidosTransportadoraModal from "./PedidosTransportadoraModal";

const TransportadoraPanel = ({ transportadora }) => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notasSelecionadas, setNotasSelecionadas] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [mostrarPedidos, setMostrarPedidos] = useState(false);
  const [pedidosRefresh, setPedidosRefresh] = useState(0);
  const [filtros, setFiltros] = useState({
    nf: "",
    fazenda: "",
    status: "",
    dataInicio: "",
    dataFim: "",
  });
  const [ordenarPor, setOrdenarPor] = useState("data_envio");
  const [ordemAscendente, setOrdemAscendente] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    vinculadas: 0,
    emTransito: 0,
    entregues: 0,
  });

  const navigate = useNavigate();
  const itensPorPagina = 20;

  useEffect(() => {
    const perfilStorage = JSON.parse(localStorage.getItem("perfil") || "null");
    setPerfil(perfilStorage);
  }, []);

  const fetchNotas = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("documentos_notas")
        .select("*")
        .eq("transportadora_nome", transportadora.nomeDocumento)
        .not("status", "eq", "cancelado")
        .order("data_envio", { ascending: false });

      if (error) {
        console.error(error);
        toast.error("Erro ao carregar notas.");
        setNotas([]);
      } else {
        setNotas(data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro inesperado ao carregar notas.");
      setNotas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  useEffect(() => {
    setStats({
      total: notas.length,
      pendentes: notas.filter((n) => n.status === "pendente").length,
      vinculadas: notas.filter((n) => n.status === "vinculada").length,
      emTransito: notas.filter((n) => n.status === "em_transito").length,
      entregues: notas.filter((n) => n.status === "entregue").length,
    });
  }, [notas]);

  const handleSalvar = async (nfId, edicao) => {
    let novoStatus = "pendente";
    if (edicao.cte && !edicao.placa) novoStatus = "vinculada";
    if (edicao.cte && edicao.placa) novoStatus = "em_transito";

    const { error } = await supabase
      .from("documentos_notas")
      .update({
        cte: edicao.cte || "",
        placa: edicao.placa?.toUpperCase() || "",
        observacao: edicao.observacao || "",
        status: novoStatus,
      })
      .eq("id", nfId);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar dados.");
      return;
    }

    try {
      await syncLotesByDocumento(nfId);
    } catch (syncError) {
      console.error(syncError);
    }

    toast.success("Informações atualizadas.");
    fetchNotas();
  };

  const toggleSelecionada = (nfId) => {
    setNotasSelecionadas((prev) =>
      prev.includes(nfId) ? prev.filter((id) => id !== nfId) : [...prev, nfId]
    );
  };

  const removerNotasCanceladas = (idsRemover) => {
    setNotas((prev) => prev.filter((nf) => !idsRemover.includes(nf.id)));
    setNotasSelecionadas([]);
  };

  const selecionarVinculadas = () => {
    setNotasSelecionadas(notasFiltradas.filter((nf) => nf.status === "vinculada").map((nf) => nf.id));
  };

  const baixarSelecionadas = async () => {
    const selecionadas = notas.filter(
      (nf) => notasSelecionadas.includes(nf.id) && nf.status === "vinculada"
    );

    if (selecionadas.length === 0) {
      toast.error("Nenhuma nota vinculada selecionada para download.");
      return;
    }

    toast.loading(`Baixando ${selecionadas.length} nota(s)...`, { id: "download" });

    for (const nf of selecionadas) {
      try {
        const { data } = await supabase.storage.from("notas").download(nf.url);
        if (!data) continue;

        const blobUrl = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = nf.nome_arquivo || "nota.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error(error);
      }
    }

    toast.success(`${selecionadas.length} nota(s) baixada(s) com sucesso.`, { id: "download" });
  };

  const handleFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setFiltros({
      nf: "",
      fazenda: "",
      status: "",
      dataInicio: "",
      dataFim: "",
    });
    setPaginaAtual(1);
  };

  const notasFiltradas = useMemo(() => {
    return notas.filter((nota) => {
      const filtroNF = filtros.nf === "" || String(nota.numero_nf).includes(filtros.nf);
      const filtroFazenda =
        filtros.fazenda === "" || nota.fazenda?.toLowerCase().includes(filtros.fazenda.toLowerCase());
      const filtroStatus = filtros.status === "" || nota.status === filtros.status;

      let filtroData = true;
      if (filtros.dataInicio) filtroData = filtroData && new Date(nota.data_envio) >= new Date(filtros.dataInicio);
      if (filtros.dataFim) filtroData = filtroData && new Date(nota.data_envio) <= new Date(filtros.dataFim);

      return filtroNF && filtroFazenda && filtroStatus && filtroData;
    });
  }, [filtros, notas]);

  const notasOrdenadas = useMemo(() => {
    return [...notasFiltradas].sort((a, b) => {
      const campoA = a[ordenarPor] || "";
      const campoB = b[ordenarPor] || "";

      if (ordenarPor === "data_envio") {
        return ordemAscendente ? new Date(campoA) - new Date(campoB) : new Date(campoB) - new Date(campoA);
      }

      return ordemAscendente
        ? String(campoA).localeCompare(String(campoB))
        : String(campoB).localeCompare(String(campoA));
    });
  }, [notasFiltradas, ordenarPor, ordemAscendente]);

  const totalPaginas = Math.max(1, Math.ceil(notasOrdenadas.length / itensPorPagina));
  const notasPaginadas = notasOrdenadas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  return (
    <div className="space-y-6">
      <GlobalHeader />

      <PainelHeader
        logo={transportadora.logo}
        title={transportadora.titulo}
        onPedidos={() => setMostrarPedidos(true)}
      />

      <button
        onClick={() => navigate(-1)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
      >
        Voltar
      </button>

      {mostrarPedidos && (
        <PedidosTransportadoraModal
          perfil={perfil}
          transportadoraId={transportadora.id}
          reloadToken={pedidosRefresh}
          onClose={() => {
            setPedidosRefresh((prev) => prev + 1);
            setMostrarPedidos(false);
          }}
        />
      )}

      <section className="glass-panel overflow-hidden rounded-[32px]">
        <div className="bg-[linear-gradient(90deg,#123b68_0%,#1f5f95_100%)] p-6 text-white">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <FaFilter />
            Dashboard de notas
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-2xl bg-white/15 p-4 text-center">
              <div className="text-2xl font-black">{stats.total}</div>
              <div className="text-sm opacity-90">Total</div>
            </div>
            <div className="rounded-2xl bg-yellow-500/20 p-4 text-center">
              <div className="text-2xl font-black">{stats.pendentes}</div>
              <div className="text-sm opacity-90">Pendentes</div>
            </div>
            <div className="rounded-2xl bg-blue-500/20 p-4 text-center">
              <div className="text-2xl font-black">{stats.vinculadas}</div>
              <div className="text-sm opacity-90">Vinculadas</div>
            </div>
            <div className="rounded-2xl bg-orange-500/20 p-4 text-center">
              <div className="text-2xl font-black">{stats.emTransito}</div>
              <div className="text-sm opacity-90">Em trânsito</div>
            </div>
            <div className="rounded-2xl bg-green-500/20 p-4 text-center">
              <div className="text-2xl font-black">{stats.entregues}</div>
              <div className="text-sm opacity-90">Entregues</div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-2 text-slate-700">
            <FaFilter />
            <h3 className="font-semibold">Filtros</h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <input
              type="text"
              name="nf"
              placeholder="Número NF"
              value={filtros.nf}
              onChange={handleFiltro}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black"
            />
            <input
              type="text"
              name="fazenda"
              placeholder="Fazenda"
              value={filtros.fazenda}
              onChange={handleFiltro}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black"
            />
            <select
              name="status"
              value={filtros.status}
              onChange={handleFiltro}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="vinculada">Vinculada</option>
              <option value="em_transito">Em trânsito</option>
              <option value="entregue">Entregue</option>
            </select>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltro}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black"
            />
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltro}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black"
            />
            <button
              onClick={limparFiltros}
              className="rounded-2xl bg-slate-600 px-4 py-3 text-sm font-bold text-white"
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={selecionarVinculadas}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#123b68] px-4 py-3 text-sm font-bold text-white"
            >
              <FaCheckCircle />
              Selecionar vinculadas
            </button>

            <button
              onClick={baixarSelecionadas}
              disabled={notasSelecionadas.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <FaDownload />
              Baixar ({notasSelecionadas.length})
            </button>

            <BotaoCancelarNotas
              notas={notas}
              selecionadas={notasSelecionadas}
              onClear={() => setNotasSelecionadas([])}
              onRemoveNotas={removerNotasCanceladas}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-slate-500">Carregando notas...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-black">
                <thead className="bg-slate-100 text-slate-700">
                  <tr className="text-center">
                    <th className="px-2 py-3">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNotasSelecionadas(notasPaginadas.map((nota) => nota.id));
                          } else {
                            setNotasSelecionadas([]);
                          }
                        }}
                        checked={
                          notasPaginadas.length > 0 && notasSelecionadas.length === notasPaginadas.length
                        }
                      />
                    </th>
                    {[
                      { label: "NF", campo: "numero_nf" },
                      { label: "Arquivo", campo: "nome_arquivo" },
                      { label: "Transportadora", campo: "transportadora_nome" },
                      { label: "Fazenda", campo: "fazenda" },
                      { label: "UF", campo: "estado" },
                      { label: "CT-e", campo: "cte" },
                      { label: "Placa", campo: "placa" },
                      { label: "Observação", campo: "observacao" },
                      { label: "Enviado", campo: "data_envio" },
                      { label: "Status", campo: "status" },
                    ].map(({ label, campo }) => (
                      <th
                        key={campo}
                        className="cursor-pointer px-3 py-3 hover:bg-slate-200"
                        onClick={() => {
                          if (ordenarPor === campo) {
                            setOrdemAscendente(!ordemAscendente);
                          } else {
                            setOrdenarPor(campo);
                            setOrdemAscendente(true);
                          }
                        }}
                      >
                        {label}
                      </th>
                    ))}
                    <th className="px-3 py-3">PDF</th>
                    <th className="px-3 py-3">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {notasPaginadas.map((nota) => (
                    <NotaLinha
                      key={nota.id}
                      nota={nota}
                      podeEditar
                      salvarEdicao={handleSalvar}
                      selecionada={notasSelecionadas.includes(nota.id)}
                      toggleSelecionada={toggleSelecionada}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <span>
                  Página {paginaAtual} de {totalPaginas} ({notasFiltradas.length} notas)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                    className="rounded-xl bg-white px-3 py-2 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                    className="rounded-xl bg-white px-3 py-2 disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default TransportadoraPanel;
