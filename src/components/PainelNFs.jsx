import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaFilter, FaDotCircle } from "react-icons/fa";
import toast from "react-hot-toast";

const PainelNFs = () => {
  const [nfs, setNFs] = useState([]);
  const [inicio, setInicio] = useState("2025-03-01");
  const [fim, setFim] = useState("2025-04-30");
  const [transportadoras, setTransportadoras] = useState([]);
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState("");

  useEffect(() => {
    carregarTransportadoras();
  }, []);

  const carregarTransportadoras = async () => {
    const { data, error } = await supabase
      .from("documentos_notas")
      .select("transportadora_nome");

    if (error) {
      toast.error("Erro ao carregar transportadoras");
      return;
    }

    const unicos = [...new Set(data.map((t) => t.transportadora_nome).filter(Boolean))];
    setTransportadoras(unicos);
  };

  const carregarNFs = async () => {
    let todasNFs = [];
    const step = 1000;
    let offset = 0;

    toast.loading("🔄 Buscando NFs...", { id: "loadNFs" });

    while (true) {
      let query = supabase
        .from("documentos_notas")
        .select("*")
        .gte("data_envio", inicio)
        .lte("data_envio", fim)
        .order("data_envio", { ascending: false })
        .range(offset, offset + step - 1);

      if (transportadoraSelecionada) {
        query = query.eq("transportadora_nome", transportadoraSelecionada);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Erro ao carregar NFs");
        break;
      }

      if (!data || data.length === 0) break;

      todasNFs = [...todasNFs, ...data];
      offset += step;
    }

    toast.success(`✅ NFs carregadas: ${todasNFs.length}`, { id: "loadNFs" });
    setNFs(todasNFs);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        📦 Painel de NFs Pendentes
      </h2>

      {/* Filtros */}
      <div className="flex gap-4 items-center mb-4 flex-wrap">
        <label className="flex items-center gap-2">
          📅 Início
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          />
        </label>
        <label className="flex items-center gap-2">
          📅 Fim
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="border px-2 py-1 rounded text-sm"
          />
        </label>

        {/* Transportadora dropdown */}
        <select
          value={transportadoraSelecionada}
          onChange={(e) => setTransportadoraSelecionada(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="">Todas as Transportadoras</option>
          {transportadoras.map((nome, i) => (
            <option key={i} value={nome}>
              {nome}
            </option>
          ))}
        </select>

        <button
          onClick={carregarNFs}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
        >
          <FaFilter /> Filtrar
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">NF</th>
              <th className="text-left px-4 py-2">Fazenda</th>
              <th className="text-left px-4 py-2">Transportadora</th>
              <th className="text-left px-4 py-2">Data Emissão</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {nfs.map((nf, i) => (
              <tr key={nf.id || i} className="even:bg-white odd:bg-gray-50">
                <td className="px-4 py-2">{nf.numero_nf}</td>
                <td className="px-4 py-2">{nf.fazenda}</td>
                <td className="px-4 py-2">{nf.transportadora_nome}</td>
                <td className="px-4 py-2">
                  {new Date(nf.data_envio).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      nf.status === "Entregue"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <FaDotCircle />
                    {nf.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm mt-4">
        📄 Total de Notas Encontradas:{" "}
        <strong className="text-blue-700">{nfs.length}</strong>
      </p>
    </div>
  );
};

export default PainelNFs;
