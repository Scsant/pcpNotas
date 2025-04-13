import TransportadoraBloco from "./TransportadoraBloco";
import toast from 'react-hot-toast';


const FazendaFormGroup = ({ grupo, onUpdate }) => {
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

  return (
    <div className="bg-white rounded p-6 space-y-4 shadow border mb-8">
      <h3 className="font-bold text-xl mb-2">
        📍 Fazenda: {grupo.fazenda || "Nova"}
      </h3>

      {/* Nome da fazenda + Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nome da Fazenda</label>
          <input
            className="w-full p-2 border rounded mt-1"
            value={grupo.fazenda}
            onChange={(e) => onUpdate({ ...grupo, fazenda: e.target.value })}
            placeholder="Ex: Fazenda Corrientes"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Estado Destino</label>
          <select
            className="w-full p-2 border rounded mt-1"
            value={grupo.estado}
            onChange={(e) => onUpdate({ ...grupo, estado: e.target.value })}
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

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl">
            📍 Fazenda: {grupo.fazenda || "Nova"}
        </h3>

        

        <button
        type="button"
        onClick={() => {
            const resumo = grupo.blocos
            .filter((b) => b.transportadora && b.qtdNotas)
            .map((b) => `🚚 ${b.transportadora}: ${b.qtdNotas} nota(s)`)
            .join("\n");

            const total = grupo.blocos.reduce(
            (acc, b) => acc + (parseInt(b.qtdNotas) || 0),
            0
            );

            toast.custom((t) => (
                <div className="bg-white border p-6 max-w-2xl w-full rounded shadow">
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
              ), {
                duration: Infinity // 👈 FIXA o toast na tela
              });
        }}
        className="text-sm text-blue-600 hover:underline"
        >
        📄 Resumo
        </button>



      </div>




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
    
        {/* Botão para adicionar novo bloco */}

      <button
        type="button"
        onClick={addBloco}
        className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded"
      >
        ➕ Adicionar Transportadora
      </button>
    </div>
  );
};

export default FazendaFormGroup;
