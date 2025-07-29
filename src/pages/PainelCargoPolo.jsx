import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import PainelHeader from "../components/PainelHeader";
import GlobalHeader from "../components/GlobalHeader";
import BotaoCancelarNotas from "../components/BotaoCancelarNotas";
import NotaLinha from "../components/NotaLinha";
import { useNavigate } from "react-router-dom";
import ModalSolicitarNota from "../components/ModalSolicitarNota";
import { FaFilter, FaDownload, FaTrash, FaEye, FaCheckCircle, FaClock, FaExclamationTriangle } from "react-icons/fa";

const PainelCargoPolo = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notasSelecionadas, setNotasSelecionadas] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtros, setFiltros] = useState({
    nf: "",
    fazenda: "",
    status: "",
    dataInicio: "",
    dataFim: ""
  });
  const [ordenarPor, setOrdenarPor] = useState("data_envio");
  const [ordemAscendente, setOrdemAscendente] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(20);
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    vinculadas: 0,
    emTransito: 0,
    entregues: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const perfilStorage = JSON.parse(localStorage.getItem("perfil"));
    setPerfil(perfilStorage);
  }, []);

  useEffect(() => {
    if (perfil) {
      fetchNotas();
    }
  }, [perfil]);

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documentos_notas")
        .select("*")
        .eq("transportadora_nome", "CARGO POLO COMERCIO, LOGISTICA")
        .not("status", "eq", "cancelado")
        .order("data_envio", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar notas");
        console.error(error);
      } else {
        setNotas(data);
        calcularEstatisticas(data);
      }
    } catch (error) {
      toast.error("Erro inesperado ao carregar notas");
      console.error(error);
    }
    setLoading(false);
  };

  const calcularEstatisticas = (dados) => {
    const stats = {
      total: dados.length,
      pendentes: dados.filter(n => n.status === "pendente").length,
      vinculadas: dados.filter(n => n.status === "vinculada").length,
      emTransito: dados.filter(n => n.status === "em_transito").length,
      entregues: dados.filter(n => n.status === "entregue").length
    };
    setStats(stats);
  };

  const handleSalvar = async (nfId, edicao) => {
    // Lógica automática de status
    let novoStatus = "pendente";
    if (edicao.cte && !edicao.placa) novoStatus = "vinculada";
    if (edicao.cte && edicao.placa) novoStatus = "em_transito";

    const payload = {
      cte: edicao.cte || "",
      placa: edicao.placa?.toUpperCase() || "",
      observacao: edicao.observacao || "",
      status: novoStatus,
    };

    const { error } = await supabase
      .from("documentos_notas")
      .update(payload)
      .eq("id", nfId);

    if (error) {
      toast.error("Erro ao salvar dados!");
      console.error(error);
    } else {
      toast.success("Informações atualizadas com sucesso!");
      fetchNotas(); // Recarrega para atualizar estatísticas
    }
  };

  const toggleSelecionada = (nfId) => {
    setNotasSelecionadas((prev) =>
      prev.includes(nfId) ? prev.filter((id) => id !== nfId) : [...prev, nfId]
    );
  };

  const removerNotasCanceladas = (idsRemover) => {
    setNotas((prev) => prev.filter((nf) => !idsRemover.includes(nf.id)));
    setNotasSelecionadas([]);
    fetchNotas(); // Recarrega para atualizar estatísticas
  };

  const selecionarTodas = () => {
    const todasVinculadas = notasFiltradas.filter(nf => nf.status === "vinculada").map(nf => nf.id);
    setNotasSelecionadas(todasVinculadas);
  };

  const baixarSelecionadas = async () => {
    const selecionadas = notas.filter(
      (nf) => notasSelecionadas.includes(nf.id) && nf.status === "vinculada"
    );

    if (selecionadas.length === 0) {
      toast.error("Nenhuma nota vinculada selecionada para download");
      return;
    }

    toast.loading(`Baixando ${selecionadas.length} nota(s)...`, { id: "download" });

    for (const nf of selecionadas) {
      try {
        const { data, error } = await supabase.storage.from("notas").download(nf.url);
        if (data) {
          const blobUrl = window.URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = nf.nome_arquivo || "nota.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
        } else {
          console.error(`Erro ao baixar ${nf.nome_arquivo}`, error);
        }
      } catch (error) {
        console.error(`Erro ao baixar ${nf.nome_arquivo}`, error);
      }
    }

    toast.success(`${selecionadas.length} nota(s) baixada(s) com sucesso!`, { id: "download" });
  };

  const handleFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setFiltros({
      nf: "",
      fazenda: "",
      status: "",
      dataInicio: "",
      dataFim: ""
    });
    setPaginaAtual(1);
  };

  const aplicarFiltros = (lista) => {
    return lista.filter((nota) => {
      const filtroNF = filtros.nf === "" || String(nota.numero_nf).includes(filtros.nf);
      const filtroFazenda = filtros.fazenda === "" || nota.fazenda?.toLowerCase().includes(filtros.fazenda.toLowerCase());
      const filtroStatus = filtros.status === "" || nota.status === filtros.status;
      
      let filtroData = true;
      if (filtros.dataInicio) {
        filtroData = filtroData && new Date(nota.data_envio) >= new Date(filtros.dataInicio);
      }
      if (filtros.dataFim) {
        filtroData = filtroData && new Date(nota.data_envio) <= new Date(filtros.dataFim);
      }

      return filtroNF && filtroFazenda && filtroStatus && filtroData;
    });
  };

  const ordenar = (lista) => {
    return [...lista].sort((a, b) => {
      const campoA = a[ordenarPor] || "";
      const campoB = b[ordenarPor] || "";
      
      if (ordenarPor === "data_envio") {
        return ordemAscendente 
          ? new Date(campoA) - new Date(campoB)
          : new Date(campoB) - new Date(campoA);
      }
      
      return ordemAscendente
        ? String(campoA).localeCompare(String(campoB))
        : String(campoB).localeCompare(String(campoA));
    });
  };

  const notasFiltradas = aplicarFiltros(notas);
  const notasOrdenadas = ordenar(notasFiltradas);
  const totalPaginas = Math.ceil(notasOrdenadas.length / itensPorPagina);
  const notasPaginadas = notasOrdenadas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "pendente":
        return <FaClock className="text-yellow-500" />;
      case "vinculada":
        return <FaCheckCircle className="text-blue-500" />;
      case "em_transito":
        return <FaExclamationTriangle className="text-orange-500" />;
      case "entregue":
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "vinculada":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "em_transito":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "entregue":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0070C0] to-[#00B050] text-white p-6">
      <PainelHeader
        logo="/rectangle-70.png"
        title="Notas Fiscais - CargoPolo"
        onSolicitar={() => setMostrarModal(true)}
      />

      {mostrarModal && (
        <ModalSolicitarNota
          transportadoraId={perfil?.transportadora_id}
          onClose={() => setMostrarModal(false)}
        />
      )}

      <GlobalHeader />
      
      {/* Botão de voltar */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold shadow"
      >
        ⬅ Voltar
      </button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Mini Painel - Estatísticas */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaEye /> Dashboard - Resumo Geral
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm opacity-90">Total</div>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.pendentes}</div>
                <div className="text-sm opacity-90">Pendentes</div>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.vinculadas}</div>
                <div className="text-sm opacity-90">Vinculadas</div>
              </div>
              <div className="bg-orange-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.emTransito}</div>
                <div className="text-sm opacity-90">Em Trânsito</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.entregues}</div>
                <div className="text-sm opacity-90">Entregues</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="p-6 bg-gray-50 border-b">
            <div className="flex items-center gap-2 mb-4">
              <FaFilter className="text-gray-600" />
              <h3 className="font-semibold text-gray-800">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <input
                type="text"
                name="nf"
                placeholder="Número NF"
                value={filtros.nf}
                onChange={handleFiltro}
                className="px-3 py-2 border border-gray-300 rounded text-black"
              />
              <input
                type="text"
                name="fazenda"
                placeholder="Fazenda"
                value={filtros.fazenda}
                onChange={handleFiltro}
                className="px-3 py-2 border border-gray-300 rounded text-black"
              />
              <select
                name="status"
                value={filtros.status}
                onChange={handleFiltro}
                className="px-3 py-2 border border-gray-300 rounded text-black"
              >
                <option value="">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="vinculada">Vinculada</option>
                <option value="em_transito">Em Trânsito</option>
                <option value="entregue">Entregue</option>
              </select>
              <input
                type="date"
                name="dataInicio"
                value={filtros.dataInicio}
                onChange={handleFiltro}
                className="px-3 py-2 border border-gray-300 rounded text-black"
              />
              <input
                type="date"
                name="dataFim"
                value={filtros.dataFim}
                onChange={handleFiltro}
                className="px-3 py-2 border border-gray-300 rounded text-black"
              />
              <button
                onClick={limparFiltros}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Limpar
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {notasFiltradas.length} de {notas.length} notas encontradas
            </div>
          </div>

          {/* Ações em Lote */}
          <div className="p-4 bg-white border-b">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={selecionarTodas}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center gap-2"
              >
                <FaCheckCircle /> Selecionar Vinculadas
              </button>
              
              <button
                onClick={baixarSelecionadas}
                disabled={notasSelecionadas.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded shadow flex items-center gap-2"
              >
                <FaDownload /> Baixar ({notasSelecionadas.length})
              </button>

              <BotaoCancelarNotas
                notas={notas}
                selecionadas={notasSelecionadas}
                onClear={() => setNotasSelecionadas([])}
                onRemoveNotas={removerNotasCanceladas}
              />
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-black">
              <thead className="bg-blue-100 text-gray-700">
                <tr className="text-center">
                  <th className="px-2 py-3">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const todasIds = notasPaginadas.map(n => n.id);
                          setNotasSelecionadas(todasIds);
                        } else {
                          setNotasSelecionadas([]);
                        }
                      }}
                      checked={notasPaginadas.length > 0 && notasSelecionadas.length === notasPaginadas.length}
                    />
                  </th>
                  <th 
                    className="px-2 py-3 cursor-pointer hover:bg-blue-200"
                    onClick={() => {
                      if (ordenarPor === "numero_nf") {
                        setOrdemAscendente(!ordemAscendente);
                      } else {
                        setOrdenarPor("numero_nf");
                        setOrdemAscendente(true);
                      }
                    }}
                  >
                    NF {ordenarPor === "numero_nf" && (ordemAscendente ? "↑" : "↓")}
                  </th>
                  <th className="px-2 py-3">Arquivo</th>
                  <th className="px-2 py-3">Fazenda</th>
                  <th className="px-2 py-3">UF</th>
                  <th className="px-2 py-3">CT-e</th>
                  <th className="px-2 py-3">Placa</th>
                  <th className="px-2 py-3">Observação</th>
                  <th 
                    className="px-2 py-3 cursor-pointer hover:bg-blue-200"
                    onClick={() => {
                      if (ordenarPor === "data_envio") {
                        setOrdemAscendente(!ordemAscendente);
                      } else {
                        setOrdenarPor("data_envio");
                        setOrdemAscendente(true);
                      }
                    }}
                  >
                    Enviado {ordenarPor === "data_envio" && (ordemAscendente ? "↑" : "↓")}
                  </th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">PDF</th>
                  <th className="px-2 py-3">Ação</th>
                </tr>
              </thead>

              <tbody>
                {notasPaginadas.map((nota) => (
                  <tr key={nota.id} className={`text-center border-b hover:bg-gray-50 ${notasSelecionadas.includes(nota.id) ? "bg-green-50" : ""}`}>
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={notasSelecionadas.includes(nota.id)}
                        onChange={() => toggleSelecionada(nota.id)}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium">{nota.numero_nf}</td>
                    <td className="px-3 py-3 text-sm">{nota.nome_arquivo}</td>
                    <td className="px-3 py-3">{nota.fazenda}</td>
                    <td className="px-3 py-3">{nota.estado}</td>
                    <td className="px-2 py-3">
                      <input
                        value={nota.cte || ""}
                        onChange={(e) => {
                          const novasNotas = notas.map(n => 
                            n.id === nota.id ? { ...n, cte: e.target.value } : n
                          );
                          setNotas(novasNotas);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm text-black"
                        placeholder="CT-e"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <input
                        value={nota.placa || ""}
                        onChange={(e) => {
                          const novasNotas = notas.map(n => 
                            n.id === nota.id ? { ...n, placa: e.target.value.toUpperCase() } : n
                          );
                          setNotas(novasNotas);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm text-black"
                        placeholder="Placa"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <input
                        value={nota.observacao || ""}
                        onChange={(e) => {
                          const novasNotas = notas.map(n => 
                            n.id === nota.id ? { ...n, observacao: e.target.value } : n
                          );
                          setNotas(novasNotas);
                        }}
                        className="border border-gray-300 rounded px-2 py-1 w-full text-sm text-black"
                        placeholder="Observação"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm">
                      {new Date(nota.data_envio).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(nota.status)}`}>
                        {getStatusIcon(nota.status)}
                        {nota.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <a
                          href={`https://prbmfjfgzjoqhfeefgxp.supabase.co/storage/v1/object/public/${nota.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                          title="Visualizar PDF"
                        >
                          📄 Ver
                        </a>
                        {nota.status === "vinculada" && (
                          <button
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.storage.from("notas").download(nota.url);
                                if (data) {
                                  const blobUrl = window.URL.createObjectURL(data);
                                  const a = document.createElement("a");
                                  a.href = blobUrl;
                                  a.download = nota.nome_arquivo || "nota.pdf";
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  window.URL.revokeObjectURL(blobUrl);
                                  toast.success("PDF baixado com sucesso!");
                                }
                              } catch (error) {
                                toast.error("Erro ao baixar PDF");
                              }
                            }}
                            className="text-green-600 hover:text-green-800 underline text-sm transition"
                            title="Baixar PDF"
                          >
                            📥 Baixar
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleSalvar(nota.id, {
                          cte: nota.cte || "",
                          placa: nota.placa || "",
                          observacao: nota.observacao || "",
                          status: nota.status || "pendente"
                        })}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded shadow"
                        title="Salvar alterações"
                      >
                        Salvar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="p-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Página {paginaAtual} de {totalPaginas} ({notasFiltradas.length} notas)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PainelCargoPolo;
