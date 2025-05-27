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
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vencidasHoje: 0,
    canceladasMes: 0,
  });


  const itensPorPagina = 20;

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("perfil"));
    setPerfil(p);
    carregarEstatisticas();
  }, []);

  useEffect(() => {
    carregarNotas();
  }, []);

  const carregarNotas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos_notas")
      .select("*")
      .order("data_envio", { ascending: false });

    if (error) {
      console.error("Erro ao carregar notas:", error);
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
        filtros.transportadora === "" || nota.transportadora_nome === filtros.transportadora;
      const filtroStatus = filtros.status === "" || nota.status === filtros.status;

      return filtroNF && filtroTransp && filtroStatus;
    });
  };


  const ordenar = (lista) => {
    return [...lista].sort((a, b) => {
      const campoA = a[ordenarPor];
      const campoB = b[ordenarPor];

      if (campoA < campoB) return ordemAscendente ? -1 : 1;
      if (campoA > campoB) return ordemAscendente ? 1 : -1;
      return 0;
    });
  };

  const salvarEdicao = async (id, campos) => {
    const { error } = await supabase
      .from("documentos_notas")
      .update(campos)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar:", error.message);
      alert("Erro ao salvar!");
    } else {
      alert("Salvo com sucesso!");
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
    
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Painel de Notas Fiscais</h1>

      {/* Filtros */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          name="nf"
          value={filtros.nf}
          onChange={handleFiltro}
          placeholder="Filtrar por Número NF"
          className="p-2 border rounded text-black"
        />
        <input
          type="text"
          name="transportadora"
          value={filtros.transportadora}
          onChange={handleFiltro}
          placeholder="Filtrar por Transportadora"
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
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <button
          onClick={carregarNotas}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          🔄 Atualizar Agora
        </button>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold shadow"
      >
        ⬅ Voltar
      </button>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={async () => {
            const { error } = await supabase.rpc("auto_expirar_notas_sem_cte");
            if (error) {
              toast.error("Erro ao rodar verificação.");
              console.error(error);
            } else {
              toast.success("Notas vencidas processadas!");
              carregarNotas();
              carregarEstatisticas();
            }
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
        >
          🧪 Rodar Verificação Agora
        </button>

        <div className="bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500 p-3 rounded shadow-sm">
          📆 Notas vencidas até hoje: <strong>{stats.vencidasHoje}</strong>
        </div>

        <div className="bg-green-100 text-green-800 border-l-4 border-green-500 p-3 rounded shadow-sm">
          ✅ Canceladas este mês: <strong>{stats.canceladasMes}</strong>
        </div>
      </div>


      {/* Tabela */}
      <div className="overflow-x-auto">

        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-blue-500 text-white">
              {[ 
                { label: "Número NF", campo: "numero_nf" },
                { label: "Nome Arquivo", campo: "nome_arquivo" },
                { label: "Transportadora", campo: "transportadora_nome" },
                { label: "Fazenda", campo: "fazenda" },
                { label: "Estado", campo: "estado" },
                { label: "CTE", campo: "cte" },
                { label: "Placa", campo: "placa" },
                { label: "Observação", campo: "observacao" },
                { label: "Data Envio", campo: "data_envio" },
                { label: "Status", campo: "status" },
              ].map(({ label, campo }) => (
                <th
                  key={campo}
                  className="px-4 py-2 cursor-pointer"
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
              <th className="px-4 py-2">Link</th>
              <th className="px-4 py-2">Salvar</th>
            </tr>
          </thead>
          <tbody>
            {notasPaginadas.map((nota) => (
              <NotaLinha
                key={nota.id}
                nota={nota}
                podeEditar={perfil?.role === "admin" || perfil?.transportadora_id === nota.transportadora_id}
                salvarEdicao={salvarEdicao}
                selecionada={notasSelecionadas.includes(nota.id)}
                toggleSelecionada={toggleSelecionada}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center items-center mt-6 gap-4">
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
          disabled={paginaAtual === 1}
        >
          ⬅️ Anterior
        </button>
        <span>{paginaAtual} / {totalPaginas}</span>
        <button
          onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
          className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
          disabled={paginaAtual === totalPaginas}
        >
          Próxima ➡️
        </button>
      </div>
    </div>
  );
};

export default PainelNotas;
