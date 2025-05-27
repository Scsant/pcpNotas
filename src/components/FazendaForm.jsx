import { useEffect } from "react";
import usePersistentState from "../hooks/usePersistentState";
import FazendaFormGroup from "./FazendaFormGroup";
import { salvarRegistro } from "../db/emissorDB";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";


// Hooks Supabase
import { useFazendasSupabase } from "../hooks/useFazendasSupabase";
import {useTransportadorasSupabase} from "../hooks/useTransp";






const FazendaForm = () => {
  const [estado, setEstado] = usePersistentState("estado", "");
  const [fazendas, setFazendas] = usePersistentState("fazendas", []);
  const navigate = useNavigate();
  const { fazendas: fazendasSupabase, loading } = useFazendasSupabase();
  const { transportadoras, loading: loadingTransportadoras } = useTransportadorasSupabase();

  const addFazenda = (fazendaSupabase = null) => {
    console.log("🆕 Fazenda adicionada:", fazendaSupabase);
    setFazendas((prev) => [
      ...prev,
      {
        id: fazendaSupabase?.id || null, // 👈 ESSA LINHA FALTAVA!
        fazenda: fazendaSupabase?.nome || "",
        estado: fazendaSupabase?.estado || "",
        blocos: [
          {
            transportadora: "",
            qtdNotas: "",
            notaInicial: "",
            notaFinal: "",
            chaves: "",
          },
        ],
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
  
    // 📦 Estrutura do registro local (IndexedDB)
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
  
    // 💾 Salva local
    await salvarRegistro(registro);
    toast.success("💾 Registro salvo no banco local (IndexedDB)!");
  
    // 🔁 Preparar inserts e updates para Supabase
    const inserts = [];
    const updates = [];
  
    fazendas.forEach((f) => {
      f.blocos.forEach((b) => {
        const registro = {
          fazenda_id: f.id,
          transportadora: b.transportadora,
          nota_inicial: Number(b.notaInicial) || 0,
          nota_final: Number(b.notaFinal) || 0,
          qtd_notas: Number(b.qtdNotas) || 0,
          criada_em: new Date().toISOString(),
        };
  
        if (b.id) {
          // update se já tiver ID
          updates.push({ ...registro, id: b.id });
        } else {
          // insert se novo
          inserts.push(registro);
        }
      });
    });
  
    // 🆕 Inserções
    if (inserts.length > 0) {
      const { error } = await supabase.from("transportadoras").insert(inserts);
      if (error) {
        console.error("❌ Erro ao inserir no Supabase:", error);
        toast.error("Erro ao inserir transportadoras no Supabase");
      } else {
        toast.success("🚚 Transportadoras inseridas com sucesso!");
      }
    }
  
    // 🛠️ Updates
    for (const u of updates) {
      const { error } = await supabase
        .from("transportadoras")
        .update(u)
        .eq("id", u.id);
  
      if (error) {
        console.error(`❌ Erro ao atualizar transportadora ID ${u.id}:`, error);
        toast.error(`Erro ao atualizar transportadora ID ${u.id}`);
      }
    }
  
    if (inserts.length === 0 && updates.length === 0) {
      toast("⚠️ Nenhuma transportadora para salvar");
    }
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl mx-auto space-y-6 mt-10 px-4"
    >
      
      {/* Botão de voltar */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold shadow"
      >
        ⬅ Voltar
      </button>
    {/* Lista de Fazendas do Supabase */}
    {!loading && fazendasSupabase.length > 0 && (
      <div className="bg-white rounded shadow p-4 text-sm text-gray-800">
        <h4 className="font-semibold mb-2">🌱 Fazendas no Supabase</h4>
        <ul className="space-y-1">
          {fazendasSupabase.map((f) => (
            <li
              key={f.id}
              className="flex justify-between items-center border-b pb-1"
            >
              <span>
                📍 <strong>{f.nome}</strong> – {f.estado}
                {f.inscricao_estadual && (
                  <span className="text-gray-600 text-xs ml-2">
                    • IE: {f.inscricao_estadual}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => addFazenda(f)}
                className="text-sm text-blue-600 hover:underline"
              >
                ➕ Usar esta
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}


      {/* Formulários das fazendas em edição */}
      {fazendas.map((fazenda, idx) => (
        fazenda && (
          <div key={idx} className="relative">
            <FazendaFormGroup
              grupo={fazenda}
              onUpdate={(data) => updateFazenda(idx, data)}
              transportadoras={transportadoras}
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
        )
      ))}

      {/* Ações */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => addFazenda()}
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
