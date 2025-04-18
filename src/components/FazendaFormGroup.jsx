import TransportadoraBloco from "./TransportadoraBloco";
import toast from "react-hot-toast";
import FazendaHistoricoModal from "./FazendaHistoricoModal";
import { useState } from "react";


const FazendaFormGroup = ({ grupo, onUpdate }) => {
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const handleBlocoChange = (blocoIndex, field, value) => {
    const newBlocos = [...grupo.blocos];
    newBlocos[blocoIndex][field] = value;
    onUpdate({ ...grupo, blocos: newBlocos });
  };

  const addBloco = () => {
    const novo = {
      transportadora: "",
      qtdNotas: "",
      notaInicial: "",
      notaFinal: "",
      chaves: "",
    };
    onUpdate({ ...grupo, blocos: [...grupo.blocos, novo] });
  };

  const baixarTxt = (grupo) => {
    const { fazenda, estado, blocos } = grupo;

    let conteudo = `📍 Fazenda: ${fazenda || "Sem nome"}\nEstado: ${estado}\n\n`;

    blocos.forEach((bloco, i) => {
      conteudo += `🔹 Transportadora: ${bloco.transportadora || "N/A"}\n`;
      conteudo += `Qtd Notas: ${bloco.qtdNotas || "-"}\n`;
      conteudo += `Nota Inicial: ${bloco.notaInicial || "-"}\n`;
      conteudo += `Nota Final: ${bloco.notaFinal || "-"}\n`;

      if (estado === "MS" && bloco.chaves) {
        const chaves = bloco.chaves.trim().split("\n").filter(Boolean);
        conteudo += `Chaves de Acesso:\n`;
        chaves.forEach((c) => (conteudo += `- ${c}\n`));
      }

      conteudo += `\n-----------------------------\n\n`;
    });

    const blob = new Blob([conteudo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Fazenda_${fazenda || "sem_nome"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const mostrarResumo = () => {
    const resumo = grupo.blocos
      .filter((b) => b.transportadora && b.qtdNotas)
      .map((b) => `🚚 ${b.transportadora}: ${b.qtdNotas} nota(s)`)
      .join("\n");

    const total = grupo.blocos.reduce(
      (acc, b) => acc + (parseInt(b.qtdNotas) || 0),
      0
    );

    toast.custom(
      (t) => (
        <div className="bg-white border p-6 max-w-2xl w-full rounded shadow text-gray-800">
          <h2 className="text-xl font-bold mb-2">
            📄 RESUMO – {grupo.fazenda || "Sem nome"}
          </h2>
          <pre className="whitespace-pre-wrap text-base leading-relaxed">
            {resumo}
          </pre>
          <p className="mt-4 font-semibold text-blue-600 text-lg">
            🧾 Total de notas: {total}
          </p>
          <div className="mt-4 text-right">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Fechar
            </button>

          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  return (
    <div className="bg-white rounded-xl p-6 space-y-6 shadow border mb-8">
      {/* Título e estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nome da Fazenda</label>
          <input
            className="w-full p-2 border rounded mt-1"
            value={grupo.fazenda}
            onChange={(e) =>
              onUpdate({ ...grupo, fazenda: e.target.value })
            }
            placeholder="Ex: Fazenda Corrientes"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Estado Destino</label>
          <select
            className="w-full p-2 border rounded mt-1"
            value={grupo.estado}
            onChange={(e) =>
              onUpdate({ ...grupo, estado: e.target.value })
            }
          >
            <option value="">Selecione o estado</option>
            <option value="MS">MS - Mato Grosso do Sul</option>
            <option value="SP">SP - São Paulo</option>
            <option value="MG">MG - Minas Gerais</option>
            <option value="PR">PR - Paraná</option>
            <option value="BA">BA - Bahia</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-between items-center">
        <div className="font-bold text-xl text-gray-800">
          📍 Fazenda: {grupo.fazenda || "Nova"}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={mostrarResumo}
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium px-4 py-2 rounded"
          >
            📄 Resumo
          </button>

          <button
            type="button"
            onClick={() => baixarTxt(grupo)}
            className="text-sm bg-green-100 hover:bg-green-200 text-green-800 font-medium px-4 py-2 rounded"
          >
            ⬇️ Baixar TXT
          </button>
        </div>
      </div>
        {mostrarHistorico && (
          <FazendaHistoricoModal
            fazenda={{ id: grupo.id || 0, nome: grupo.fazenda }}
            onClose={() => setMostrarHistorico(false)}
          />
        )}

      {/* Blocos de transportadoras */}
      {grupo.blocos.map((bloco, i) => (
        <TransportadoraBloco
          key={i}
          bloco={bloco}
          onChange={(field, value) => handleBlocoChange(i, field, value)}
          onRemove={() => {
            const novosBlocos = grupo.blocos.filter((_, idx) => idx !== i);
            onUpdate({ ...grupo, blocos: novosBlocos });
          }}
          estado={grupo.estado}
        />
      ))}

      {/* Botão adicionar transportadora */}
      <button
        type="button"
        onClick={addBloco}
        className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm"
      >
        ➕ Adicionar Transportadora
      </button>
      <button
        type="button"
        onClick={() => setMostrarHistorico(true)}
        className="text-sm text-blue-600 hover:underline mr-4"
      >
        📊 Ver Histórico
      </button>

      
    </div>
    
  );
};


export default FazendaFormGroup;
