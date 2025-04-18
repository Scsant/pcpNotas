import toast from 'react-hot-toast';
import { useState } from "react";

const transportadoras = [
  "Cargo Polo",
  "Garbuio",
  "JSL",
  "Nepomuceno",
  "VDA",
  "Olsen",
  "Serrana",
  "Placidos",
  "Bracell",
];

const TransportadoraBloco = ({ bloco, onChange, estado, onRemove }) => {
  const [chaveCopiadaId, setChaveCopiadaId] = useState(null);

  const chavesSeparadas = bloco.chaves
    ?.trim()
    .split("\n")
    .filter(Boolean) || [];

  const copiarChave = async (chave, id) => {
    try {
      await navigator.clipboard.writeText(chave);
      setChaveCopiadaId(id);
      toast.success("✅ Chave copiada!"); 
    } catch (err) {
      toast.error("Erro ao copiar chave.");
    }
  };

  return (
    <div className="border p-4 rounded bg-gray-50 space-y-4">
      <h4 className="font-semibold text-lg">
        Transportadora: {bloco.transportadora || "Nova"}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Transportadora</label>
          <select
            className="p-2 border rounded w-full"
            value={bloco.transportadora}
            onChange={(e) => onChange("transportadora", e.target.value)}
          >
            <option value="">Selecione</option>
            {transportadoras.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Qtde de Notas</label>
          <input
            type="number"
            className="p-2 border rounded w-full"
            value={bloco.qtdNotas}
            onChange={(e) => onChange("qtdNotas", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nota Inicial</label>
          <input
            type="number"
            className="p-2 border rounded w-full"
            value={bloco.notaInicial}
            onChange={(e) => onChange("notaInicial", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Nota Final</label>
          <input
            type="number"
            className="p-2 border rounded w-full"
            value={bloco.notaFinal}
            onChange={(e) => onChange("notaFinal", e.target.value)}
          />
        </div>
      </div>

      {estado === "MS" && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            Chaves de Acesso
          </label>
          <textarea
            rows={4}
            className="p-2 w-full border rounded"
            placeholder="Cole as chaves, uma por linha"
            value={bloco.chaves}
            onChange={(e) => onChange("chaves", e.target.value)}
          />

          <div className="mt-4 space-y-2">
            {chavesSeparadas.map((chave, idx) => {
              const id = `${bloco.notaInicial}-${idx}`;
              const isCopiada = chaveCopiadaId === id;

              return (
                <div
                  key={id}
                  className={`flex items-center justify-between p-2 rounded border transition-all duration-300 ${
                    isCopiada
                      ? "bg-yellow-100 border-yellow-400 ring-2 ring-yellow-400"
                      : "bg-white hover:bg-blue-50"
                  }`}
                >
                  <span className="text-sm font-mono break-all">{chave}</span>
                  <button
                    type="button"
                    onClick={() => copiarChave(chave, id)}
                    className={`text-xs px-3 py-1 rounded transition ${
                      isCopiada
                        ? "bg-yellow-300 text-yellow-900 font-semibold"
                        : "text-blue-600 hover:underline"
                    }`}
                  >
                    {isCopiada ? "✅ Copiado!" : "📋 Copiar"}
                  </button>
                </div>
              );
            })}
            {chavesSeparadas.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Total: <strong>{chavesSeparadas.length}</strong> chave(s)
              </p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="text-red-600 hover:underline text-sm"
      >
        🗑 Remover Transportadora
      </button>
    </div>
  );
};

export default TransportadoraBloco;
