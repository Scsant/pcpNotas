import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotaLinha from "../components/NotaLinha";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const PainelNotas = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ nf: "", transportadora: "", status: "" });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenarPor, setOrdenarPor] = useState("data_envio");
  const [ordemAscendente, setOrdemAscendente] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [notasSelecionadas, setNotasSelecionadas] = useState([]);
  const [stats, setStats] = useState({ vencidasHoje: 0, canceladasMes: 0 });

  const navigate = useNavigate();
  const itensPorPagina = 20;

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("perfil"));
    setPerfil(p);
  }, []);

  useEffect(() => {
    if (perfil) {
      carregarNotas();
      carregarEstatisticas();
    }
  }, [perfil]);

  const carregarNotas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos_notas")
      .select("*")
      .order("data_envio", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar notas.");
      console.error(error);
    } else {
      setNotas(data);
    }
    setLoading(false);
  };

  const carregarEstatisticas = async () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const primeiroDiaMes = hoje.slice(0, 8) + "01";

    const { count: vencidasHoje } = await supabase
      .from("documentos_notas")
      .select("id", { count: "exact", head: true })
      .lte("data_envio", hoje)
      .is("cte", null);

    const { count: canceladasMes } = await supabase
      .from("documentos_notas_canceladas")
      .select("id", { count: "exact", head: true })
      .gte("data_cancelamento", primeiroDiaMes);

    setStats({
      vencidasHoje: vencidasHoje || 0,
      canceladasMes: canceladasMes || 0,
    });
  };

  const handleFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPaginaAtual(1);
  };

  const aplicarFiltros = (lista) => {
    return lista.filter((nota) => {
      if (perfil?.role !== "admin" && perfil?.transportadora_id !== nota.transportadora_id)
        return false;

      const filtroNF = filtros.nf === "" || String(nota.numero_nf).includes(filtros.nf);
      const filtroTransp =
        filtros.transportadora === "" ||
        nota.transportadora_nome?.toLowerCase().includes(filtros.transportadora.toLowerCase());
      const filtroStatus =
        filtros.status === "" || nota.status === filtros.status;

      return filtroNF && filtroTransp && filtroStatus;
    });
  };

  const ordenar = (lista) => {
    return [...lista].sort((a, b) => {
      const campoA = a[ordenarPor] || "";
      const campoB = b[ordenarPor] || "";
      return ordemAscendente
        ? campoA.localeCompare(campoB)
        : campoB.localeCompare(campoA);
    });
  };

  const salvarEdicao = async (id, campos) => {
    const { error } = await supabase.from("documentos_notas").update(campos).eq("id", id);

    if (error) {
      toast.error("Erro ao salvar dados.");
      console.error(error);
    } else {
      toast.success("Salvo com sucesso!");
      carregarNotas();
    }
  };

  const toggleSelecionada = (nfId) => {
    setNotasSelecionadas((prev) =>
      prev.includes(nfId) ? prev.filter((id) => id !== nfId) : [...prev, nfId]
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-2xl text-blue-700">
        Carregando notas...
      </div>
    );
  }

  const notasFiltradas = ordenar(aplicarFiltros(notas));
  const totalPaginas = Math.ceil(notasFiltradas.length / itensPorPagina);
  const notasPaginadas = notasFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-900">Painel de Notas Fiscais</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          name="nf"
          value={filtros.nf}
          onChange={handleFiltro}
          placeholder="Número NF"
          className="p-2 border rounded text-black"
        />
        <input
          type="text"
          name="transportadora"
          value={filtros.transportadora}
          onChange={handleFiltro}
          placeholder="Transportadora"
          className="p-2 border rounded text-black"
        />
        <select
          name="status"
          value={filtros.status}
          onChange={handleFiltro}
          className="p-2 border rounded text-black"
        >
          <option value="">Todos Status</option>
          <option value="pendente">Pendente</option>
          <option value="vinculada">Vinculada</option>
          <option value="em_transito">Em trânsito</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <button
          onClick={carregarNotas}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Atualizar
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start">
        <button
          onClick={async () => {
            const { error } = await supabase.rpc("auto_expirar_notas_sem_cte");
            if (error) {
              toast.error("Erro ao rodar verificação.");
            } else {
              toast.success("Verificação concluída!");
              carregarNotas();
              carregarEstatisticas();
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
        >
          🧪 Rodar Verificação
        </button>

        <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500 p-3 rounded">
          📆 Vencidas até hoje: <strong>{stats.vencidasHoje}</strong>
        </div>
        <div className="bg-green-100 text-green-800 border-l-4 border-green-500 p-3 rounded">
          ✅ Canceladas este mês: <strong>{stats.canceladasMes}</strong>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto bg-white rounded shadow mb-4">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-blue-500 text-white">
            <tr>
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
                  className="px-3 py-2 cursor-pointer"
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
              <th className="px-3 py-2">PDF</th>
              <th className="px-3 py-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {notasPaginadas.map((nota) => (
              <NotaLinha
                key={nota.id}
                nota={nota}
                podeEditar={
                  perfil?.role === "admin" ||
                  perfil?.transportadora_id === nota.transportadora_id
                }
                salvarEdicao={salvarEdicao}
                selecionada={notasSelecionadas.includes(nota.id)}
                toggleSelecionada={toggleSelecionada}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          disabled={paginaAtual === 1}
        >
          ⬅ Anterior
        </button>
        <span className="font-semibold">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <button
          onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
          className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          disabled={paginaAtual === totalPaginas}
        >
          Próxima ➡
        </button>
      </div>
    </div>
  );
};

export default PainelNotas;
