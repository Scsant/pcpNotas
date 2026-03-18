import { useEffect, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineChartBarSquare,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { toast } from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { syncLotesByDocumento } from "../lib/lotes";
import NotaLinha from "../components/NotaLinha";

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
    const { data, error } = await supabase.from("documentos_notas").select("*").order("data_envio", { ascending: false });

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
    const primeiroDiaMes = `${hoje.slice(0, 8)}01`;

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

  const aplicarFiltros = (lista) =>
    lista.filter((nota) => {
      if (perfil?.role !== "admin" && perfil?.transportadora_id !== nota.transportadora_id) {
        return false;
      }

      const filtroNF = filtros.nf === "" || String(nota.numero_nf).includes(filtros.nf);
      const filtroTransp =
        filtros.transportadora === "" ||
        nota.transportadora_nome?.toLowerCase().includes(filtros.transportadora.toLowerCase());
      const filtroStatus = filtros.status === "" || nota.status === filtros.status;

      return filtroNF && filtroTransp && filtroStatus;
    });

  const ordenar = (lista) =>
    [...lista].sort((a, b) => {
      const campoA = a[ordenarPor] || "";
      const campoB = b[ordenarPor] || "";
      return ordemAscendente ? campoA.localeCompare(campoB) : campoB.localeCompare(campoA);
    });

  const salvarEdicao = async (id, campos) => {
    const { error } = await supabase.from("documentos_notas").update(campos).eq("id", id);

    if (error) {
      toast.error("Erro ao salvar dados.");
      console.error(error);
    } else {
      try {
        await syncLotesByDocumento(id);
      } catch (syncError) {
        console.error(syncError);
      }

      toast.success("Alterações salvas.");
      carregarNotas();
    }
  };

  const toggleSelecionada = (nfId) => {
    setNotasSelecionadas((prev) => (prev.includes(nfId) ? prev.filter((id) => id !== nfId) : [...prev, nfId]));
  };

  const rodarVerificacao = async () => {
    const { error } = await supabase.rpc("auto_expirar_notas_sem_cte");
    if (error) {
      toast.error("Erro ao rodar verificação.");
    } else {
      toast.success("Verificação concluída.");
      carregarNotas();
      carregarEstatisticas();
    }
  };

  if (loading) {
    return (
      <div className="glass-panel flex min-h-[70vh] items-center justify-center rounded-[32px] text-xl font-semibold text-[#123b68]">
        Carregando notas fiscais...
      </div>
    );
  }

  const notasFiltradas = ordenar(aplicarFiltros(notas));
  const totalPaginas = Math.max(1, Math.ceil(notasFiltradas.length / itensPorPagina));
  const notasPaginadas = notasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Monitoramento fiscal</p>
            <h1 className="section-title mt-2 text-3xl font-black md:text-4xl">Painel de Notas Fiscais</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              Acompanhe o status das notas emitidas, centralize o retorno das transportadoras e identifique gargalos
              antes do fechamento mensal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={carregarNotas}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <HiOutlineArrowPath />
              Atualizar painel
            </button>

            <button
              onClick={rodarVerificacao}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#123b68] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f3259]"
            >
              <HiOutlineChartBarSquare />
              Rodar verificação
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Notas filtradas</p>
            <p className="mt-3 text-3xl font-black text-[#123b68]">{notasFiltradas.length}</p>
          </div>

          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              <HiOutlineCalendarDays />
              Vencidas até hoje
            </p>
            <p className="mt-3 text-3xl font-black text-amber-900">{stats.vencidasHoje}</p>
          </div>

          <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Canceladas no mês</p>
            <p className="mt-3 text-3xl font-black text-emerald-900">{stats.canceladasMes}</p>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Selecionadas</p>
            <p className="mt-3 text-3xl font-black text-slate-800">{notasSelecionadas.length}</p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <input
            type="text"
            name="nf"
            value={filtros.nf}
            onChange={handleFiltro}
            placeholder="Número da NF"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
          />
          <input
            type="text"
            name="transportadora"
            value={filtros.transportadora}
            onChange={handleFiltro}
            placeholder="Transportadora"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
          />
          <select
            name="status"
            value={filtros.status}
            onChange={handleFiltro}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="vinculada">Vinculada</option>
            <option value="em_transito">Em trânsito</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 md:col-span-3 xl:col-span-2">
            Ordenação atual por <span className="font-bold text-slate-700">{ordenarPor}</span> em{" "}
            <span className="font-bold text-slate-700">{ordemAscendente ? "ordem crescente" : "ordem decrescente"}</span>.
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden rounded-[32px]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#123b68] text-white">
              <tr>
                <th className="px-3 py-4 text-center">Sel.</th>
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
                    className="cursor-pointer px-3 py-4 font-bold"
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
                <th className="px-3 py-4 font-bold">PDF</th>
                <th className="px-3 py-4 font-bold">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {notasPaginadas.length > 0 ? (
                notasPaginadas.map((nota) => (
                  <NotaLinha
                    key={nota.id}
                    nota={nota}
                    podeEditar={perfil?.role === "admin" || perfil?.transportadora_id === nota.transportadora_id}
                    salvarEdicao={salvarEdicao}
                    selecionada={notasSelecionadas.includes(nota.id)}
                    toggleSelecionada={toggleSelecionada}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="px-6 py-10 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                      <HiOutlineExclamationTriangle />
                      Nenhuma nota encontrada com os filtros atuais.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={paginaAtual === 1}
        >
          Anterior
        </button>
        <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <button
          onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={paginaAtual === totalPaginas}
        >
          Próxima
        </button>
      </section>
    </div>
  );
};

export default PainelNotas;
