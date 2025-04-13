import { useEffect, useState } from "react";
import { listarRegistros, limparRegistros } from "../db/emissorDB";
import { deletarRegistro } from "../db/emissorDB";


const Historico = () => {
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const dados = await listarRegistros();
      setRegistros(dados.reverse()); // mostrar mais recentes primeiro
    };
    fetch();
  }, []);

  const handleLimpar = async () => {
    const confirm = window.confirm("Tem certeza que deseja limpar TODO o histórico?");
    if (confirm) {
      await limparRegistros();
      setRegistros([]);
      alert("🧹 Histórico limpo!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-black">📜 Histórico de Registros</h2>
        <button
          onClick={handleLimpar}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          🗑 Limpar Histórico
        </button>
      </div>

      {registros.length === 0 ? (
        <p className="text-gray-600">Nenhum registro salvo ainda.</p>
      ) : (
        registros.map((registro, idx) => (
          <div key={idx} className="bg-white p-6 mb-6 rounded shadow">
            <p className="text-sm text-gray-500 mb-2">
              <strong>Data:</strong>{" "}
              {new Date(registro.dataRegistro).toLocaleString("pt-BR")}
            </p>
            <p className="mb-2">
              <strong>Estado Destino:</strong> {registro.estado}
            </p>
          <button
            onClick={async () => {
                if (confirm("Deseja realmente apagar este registro?")) {
                await deletarRegistro(registro.id);
                setRegistros(registros.filter((r) => r.id !== registro.id));
                }
            }}
            className="text-red-600 hover:underline text-sm"
            >
            🗑 Apagar
          </button>


            {registro.fazendas.map((fazenda, i) => (
              <div key={i} className="mb-4">
                <h3 className="text-lg font-bold">🏡 Fazenda: {fazenda.nome}</h3>
                {fazenda.transportadoras.map((t, j) => (
                  <div
                    key={j}
                    className="border-l-4 border-blue-400 pl-4 py-2 my-2 bg-blue-50 rounded"
                  >
                    <p><strong>🚚 Transportadora:</strong> {t.nome}</p>
                    <p>
                      <strong>Notas:</strong> {t.qtdNotas} |{" "}
                      {t.notaInicial} à {t.notaFinal}
                    </p>
                    {t.chaves?.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        🔑 {t.chaves.length} chave(s)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default Historico;
