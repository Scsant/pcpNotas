import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

const BotaoCancelarNotas = ({ notas, selecionadas, onClear, onRemoveNotas }) => {
  const enviarCancelamento = async () => {
    const confirm = window.confirm(
      `Você está solicitando o cancelamento de ${selecionadas.length} nota(s). Deseja confirmar?`
    );
    if (!confirm) return;

    const perfil = JSON.parse(localStorage.getItem("perfil"));

    // Monta payload com os dados corretos
    const payload = notas
      .filter((nf) => selecionadas.includes(nf.id)) // <-- nf.id = UUID
      .map((nf) => ({
        numero_nota: nf.numero_nf,
        transportadora_id: perfil?.transportadora_id,
        perfil_id: perfil?.user_id,
        data_cancelamento: new Date(),
        status_cancelamento: "solicitado",
        data_emissao: nf.data_envio,
      }));

    // 1. Insere na tabela de notas canceladas
    const { error: insertError } = await supabase
      .from("documentos_notas_canceladas")
      .insert(payload);

    if (insertError) {
      toast.error("Erro ao solicitar cancelamento");
      console.error("Erro Supabase (insert):", insertError);
      return;
    }

    // 2. Remove da tabela original por ID (uuid)
    const { error: deleteError } = await supabase
      .from("documentos_notas")
      .delete()
      .in("id", selecionadas); // agora usando uuid corretamente

    if (deleteError) {
      toast.error("Cancelamento inserido, mas houve erro ao remover da tabela original");
      console.error("Erro Supabase (delete):", deleteError);
    } else {
      toast.success("Solicitação enviada e nota removida!");
    }

    // 3. Atualiza front-end
    onClear();
    onRemoveNotas(selecionadas);
  };

  if (selecionadas.length === 0) return null;

  return (
    <div className="mt-4 text-right px-4 pb-4">
      <button
        onClick={enviarCancelamento}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
      >
        Enviar para Cancelamento ({selecionadas.length})
      </button>
    </div>
  );
};

export default BotaoCancelarNotas;
