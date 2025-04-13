import { useEffect } from "react";
import usePersistentState from "../hooks/usePersistentState";
import FazendaFormGroup from "./FazendaFormGroup";
import { salvarRegistro } from "../db/emissorDB";
import toast from "react-hot-toast";


const FazendaForm = () => {
  const [estado, setEstado] = usePersistentState("estado", "");
  const [fazendas, setFazendas] = usePersistentState("fazendas", []);

  const addFazenda = () => {
    setFazendas((prev) => [
      ...prev,
      {
        fazenda: "",
        estado: "", // agora cada uma tem o seu
        blocos: [{ transportadora: "", qtdNotas: "", notaInicial: "", notaFinal: "", chaves: "" }],
      },
    ]);
  };

  const updateFazenda = (index, data) => {
    const copy = [...fazendas];
    copy[index] = data;
    setFazendas(copy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const registro = {
      estado,
      fazendas: fazendas.map((f) => ({
        nome: f.fazenda,
        transportadoras: f.blocos.map((b) => ({
          nome: b.transportadora,
          qtdNotas: b.qtdNotas,
          notaInicial: b.notaInicial,
          notaFinal: b.notaFinal,
          chaves: (b.chaves || "").trim().split("\n").filter(Boolean),
        })),
      })),
    };
  
    await salvarRegistro(registro);
    toast.success("💾 Registro salvo no banco local (IndexedDB)!");
  };
  

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl mx-auto space-y-6 mt-10 px-4"
    >
     



      {fazendas.map((fazenda, idx) => (
        <div key={idx} className="relative">
            <FazendaFormGroup
            grupo={fazenda}
            onUpdate={(data) => updateFazenda(idx, data)}
            />
            <button
            type="button"
            onClick={() => {
                const novas = [...fazendas];
                novas.splice(idx, 1);
                setFazendas(novas);
            }}
            className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
            >
            🗑 Remover Fazenda
            </button>
        </div>
     ))}


      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={addFazenda}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          ➕ Adicionar Fazenda
        </button>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          💾 Salvar Tudo
        </button>
      </div>
    </form>
  );
};

export default FazendaForm;
