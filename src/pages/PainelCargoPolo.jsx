import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import PainelHeader from "../components/PainelHeader";
import GlobalHeader from "../components/GlobalHeader";
import BotaoCancelarNotas from "../components/BotaoCancelarNotas";
import NotaLinha from "../components/NotaLinha";
import { useNavigate } from "react-router-dom";
import ModalSolicitarNota from "../components/ModalSolicitarNota";

const PainelCargoPolo = () => {
  const [notas, setNotas] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [notasSelecionadas, setNotasSelecionadas] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const navigate = useNavigate();
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    const perfilStorage = JSON.parse(localStorage.getItem("perfil"));
    setPerfil(perfilStorage);
  }, []);

  useEffect(() => {
    if (perfil) {
      fetchNotas();
    }
  }, [perfil]);

  const fetchNotas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos_notas")
      .select("*")
      .eq("transportadora_nome", "CARGO POLO COMERCIO, LOGISTICA")
      .not("status", "eq", "cancelado");

    if (error) {
      toast.error("Erro ao carregar notas");
      console.error(error);
    } else {
      setNotas(data);
    }

    setLoading(false);
  };

  const handleSalvar = async (nfId, edicao) => {
    const payload = {
      nf_id: nfId,
      cte: edicao.cte || "",
      placa: edicao.placa?.toUpperCase() || "",
      observacao: edicao.observacao || "",
      transportadora_id: perfil?.transportadora_id,
      status: edicao.status || "pendente",
    };

    const { error } = await supabase
      .from("informacoes_complementares")
      .upsert(payload, { onConflict: "nf_id" });

    if (error) {
      toast.error("Erro ao salvar dados!");
      console.error(error);
    } else {
      toast.success("Salvo com sucesso!");
    }
  };

  const toggleSelecionada = (nfId) => {
    setNotasSelecionadas((prev) =>
      prev.includes(nfId) ? prev.filter((id) => id !== nfId) : [...prev, nfId]
    );
  };

  const removerNotasCanceladas = (idsRemover) => {
    setNotas((prev) => prev.filter((nf) => !idsRemover.includes(nf.id)));
  };

  return (
        

    <div className="min-h-screen bg-gradient-to-r from-[#0070C0] to-[#00B050] text-white p-6">
        <PainelHeader
          logo="/rectangle-70.png"
          title="Notas Fiscais - Cargo Polo"
          onSolicitar={() => setMostrarModal(true)} // 🔥 AQUI!
        />

        {mostrarModal && (
          <ModalSolicitarNota
            transportadoraId={perfil?.transportadora_id}
            onClose={() => setMostrarModal(false)}
          />
        )}
      <GlobalHeader />
      {/* Botão de voltar */}
      <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold shadow"
      >
          ⬅ Voltar
      </button>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        
        <div className="bg-white rounded-xl shadow-lg overflow-auto p-4">

          {/* Mini Painel */}
          <div className="text-gray-800 font-medium text-sm p-2 bg-white rounded-t-md border-b shadow-sm">
            📊 Total de Notas Carregadas: <strong className="text-blue-600">{notas.length}</strong>
          </div>


          <BotaoCancelarNotas
            notas={notas}
            selecionadas={notasSelecionadas}
            onClear={() => setNotasSelecionadas([])}
            onRemoveNotas={removerNotasCanceladas}
          />

          <table className="min-w-full text-sm text-black border-collapse border border-gray-200 mt-4">
            <thead className="bg-blue-100 text-gray-700">
              <tr className="text-center">
                <th className="px-2 py-2">✓</th>
                <th className="px-2 py-2">NF</th>
                <th className="px-2 py-2">Arquivo</th>
                <th className="px-2 py-2">Transportadora</th>
                <th className="px-2 py-2">Fazenda</th>
                <th className="px-2 py-2">UF</th>
                <th className="px-2 py-2">CT-e</th>
                <th className="px-2 py-2">Placa</th>
                <th className="px-2 py-2">Observação</th>
                <th className="px-2 py-2">Enviado</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">PDF</th>
                <th className="px-2 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((nota) => (
                <NotaLinha
                  key={nota.id}
                  nota={nota}
                  podeEditar={true}
                  salvarEdicao={handleSalvar}
                  selecionada={notasSelecionadas.includes(nota.id)}
                  toggleSelecionada={toggleSelecionada}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PainelCargoPolo;
