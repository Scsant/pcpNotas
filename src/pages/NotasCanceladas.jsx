import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const transportadoras = [
    { id: 1, nome: "CargoPolo", src: "/rectangle-70.png" },
    { id: 2, nome: "VDA", src: "/rectangle-140.png" },
    { id: 3, nome: "EN", src: "/rectangle-80.png" },
    { id: 4, nome: "Garbúio", src: "/rectangle-90.png" },
    { id: 5, nome: "JSL", src: "/rectangle-100.png" },
    { id: 6, nome: "TransOlsen", src: "/rectangle-110.png" },
    { id: 7, nome: "Plácido", src: "/rectangle-120.png" },
    { id: 8, nome: "Serranalog", src: "/rectangle-130.png" },
  ];
  

const NotasCanceladas = () => {
  const [notas, setNotas] = useState([]);
  const [filtros, setFiltros] = useState({ nf: "", transportadora: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotas = async () => {
      const { data, error } = await supabase
        .from("documentos_notas_canceladas")
        .select("*")
        .order("data_cancelamento", { ascending: false });

      if (error) {
        console.error("Erro ao buscar notas canceladas:", error.message);
        return;
      }

      setNotas(data);
    };

    fetchNotas();
  }, []);

  const notasFiltradas = notas.filter((nota) => {
    const filtroNF =
      filtros.nf === "" || nota.numero_nota?.toString().includes(filtros.nf);
    const filtroTransp =
      filtros.transportadora === "" ||
      nota.transportadora_id?.toString().includes(filtros.transportadora);

    return filtroNF && filtroTransp;
  });

  const totalCanceladas = notasFiltradas.length;
  const ultimaData =
    notasFiltradas[0]?.data_cancelamento &&
    new Date(notasFiltradas[0].data_cancelamento).toLocaleDateString();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Notas Fiscais Canceladas
      </h1>

      {/* Filtros */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Filtrar por Número NF"
          value={filtros.nf}
          onChange={(e) => setFiltros({ ...filtros, nf: e.target.value })}
          className="p-2 border rounded text-black"
        />
        <input
          type="text"
          placeholder="Filtrar por Transportadora"
          value={filtros.transportadora}
          onChange={(e) =>
            setFiltros({ ...filtros, transportadora: e.target.value })
          }
          className="p-2 border rounded text-black"
        />
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white text-black p-4 rounded shadow text-center font-semibold">
          Total a Cancelar:{" "}
          <span className="text-red-600 text-xl">{totalCanceladas}</span>
        </div>
        <div className="bg-white text-black p-4 rounded shadow text-center font-semibold">
          Último Cancelamento:{" "}
          <span className="text-blue-600">{ultimaData || "—"}</span>
        </div>
        <div className="bg-white text-black p-4 rounded shadow text-center font-semibold">
          Transportadora + ativa:{" "}
          <span className="text-green-600">[FUTURO]</span>
        </div>
      </div>

      {/* Botão de voltar */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold shadow"
      >
        ⬅ Voltar
      </button>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-[1500px] table-fixed bg-white shadow rounded overflow-hidden">
          <thead>
            <tr className="bg-blue-500 text-white">
                <th className="px-4 py-2 text-left whitespace-nowrap">Número NF</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Status</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Data Cancelamento</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Data Emissão</th>
                <th className="px-4 py-2 text-left whitespace-nowrap">Transportadora ID</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {notasFiltradas.map((nota) => (
              <tr
                key={nota.id}
                className="border-b border-gray-200 hover:bg-gray-100 transition"
              >
                <td className="px-4 py-2">{nota.numero_nota}</td>
                <td className="px-4 py-2">{nota.status_cancelamento}</td>
                <td className="px-4 py-2">
                  {new Date(nota.data_cancelamento).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {new Date(nota.data_emissao).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                    {(() => {
                        const t = transportadoras.find(t => t.id === nota.transportadora_id);
                        return t ? (
                        <div className="flex items-center gap-2">
                            <img src={t.src} alt={t.nome} className="w-8 h-8 rounded-full object-cover" />
                            <span>{t.nome}</span>
                        </div>
                        ) : (
                        <span>ID {nota.transportadora_id}</span>
                        );
                    })()}
                </td>


              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NotasCanceladas;
