import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaFileExcel } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function FazendaHistoricoModal({ fazenda, onClose }) {
  const [transportadoras, setTransportadoras] = useState([]);
  const [periodo, setPeriodo] = useState("todos");
  const [chaveCopiadaId, setChaveCopiadaId] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("*")
        .eq("fazenda_id", fazenda.id)
        .order("criada_em", { ascending: false });

      if (error) {
        console.error("Erro ao buscar transportadoras:", error);
      } else {
        setTransportadoras(data);
      }
    };

    buscar();
  }, [fazenda.id]);

  const copiarChave = (idUnico, chave) => {
    navigator.clipboard.writeText(chave);
    setChaveCopiadaId(idUnico);
    setTimeout(() => setChaveCopiadaId(null), 2000);
    console.log("Copiando:", chave, "ID:", idUnico);

  };

  const filtrarPorPeriodo = (lista) => {
    const hoje = new Date();
    return lista.filter((item) => {
      const data = new Date(item.criada_em);
      switch (periodo) {
        case "dia":
          return data.toDateString() === hoje.toDateString();
        case "semana":
          const semana = new Date();
          semana.setDate(hoje.getDate() - 7);
          return data >= semana;
        case "mes":
          return (
            data.getMonth() === hoje.getMonth() &&
            data.getFullYear() === hoje.getFullYear()
          );
        case "ano":
          return data.getFullYear() === hoje.getFullYear();
        default:
          return true;
      }
    });
  };

  const transportadorasFiltradas = filtrarPorPeriodo(transportadoras);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white max-w-2xl w-full rounded-xl shadow-lg p-6 relative">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          📊 <span className="text-blue-800">Histórico</span> –{" "}
          <span className="text-gray-800">{fazenda.nome}</span>
        </h2>

        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="mb-4 border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="todos">🗂 Todos</option>
          <option value="dia">📅 Hoje</option>
          <option value="semana">📆 Semana</option>
          <option value="mes">🗓 Mês</option>
          <option value="ano">📈 Ano</option>
        </select>

        {transportadorasFiltradas.length === 0 ? (
          <p className="text-gray-600">Nenhum registro encontrado.</p>
        ) : (
          <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {transportadorasFiltradas.map((t, idx) => (
              <li
                key={idx}
                className="border rounded-md p-4 shadow-sm bg-gray-50"
              >
                <p><strong>🚚 Transportadora:</strong> {t.transportadora}</p>
                <p>📥 Nota Inicial: {t.nota_inicial}</p>
                <p>📤 Nota Final: {t.nota_final}</p>
                <p>🧾 Total de Notas: {t.qtd_notas}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Criado em: {new Date(t.criada_em).toLocaleString()}
                </p>

   


                {t.chaves && (
                  <div className="mt-2 space-y-1">
                    
                    {t.chaves
                      .split("\n")
                      .filter(Boolean)
                      .map((chave, i) => {
                        const idUnico = `${t.id}-${i}`;
                        const isCopiada = chaveCopiadaId === idUnico;

                        return (
                          <div
                            key={idUnico}
                            className={`flex justify-between items-center text-sm p-2 rounded border transition-all duration-300 ${
                              isCopiada
                                ? "bg-yellow-100 border-yellow-400 ring-2 ring-yellow-400"
                                : "bg-white hover:bg-blue-50"
                            }`}
                          >
                            <span className="truncate w-full pr-2">{chave}</span>
                            <button
                              onClick={() => copiarChave(idUnico, chave)}
                              className={`flex items-center gap-1 text-xs px-3 py-1 rounded transition-all duration-300 ${
                                isCopiada
                                  ? "bg-yellow-300 text-yellow-900 font-semibold"
                                  : "text-blue-600 hover:underline"
                              }`}
                            >
                              {isCopiada ? (
                                <>
                                  ✅ <span>Copiado!</span>
                                </>
                              ) : (
                                <>
                                  📋 <span>Copiar</span>
                                </>
                              )}
                            </button>

                          </div>
                        );
                      })}
                  </div>
                )}



              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => {
              // exportarExcel(); ← pronto pra ligar aqui
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaFileExcel />
            Baixar Excel
          </button>
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            ❌ Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default FazendaHistoricoModal;
