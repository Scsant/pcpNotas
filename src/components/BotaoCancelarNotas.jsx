import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { FaTrash, FaExclamationTriangle } from "react-icons/fa";

const BotaoCancelarNotas = ({ notas, selecionadas, onClear, onRemoveNotas }) => {
  const enviarCancelamento = async () => {
    const confirm = window.confirm(
      `⚠️ ATENÇÃO: Você está solicitando o cancelamento de ${selecionadas.length} nota(s).\n\nEsta ação não pode ser desfeita. Deseja confirmar?`
    );
    if (!confirm) return;

    toast.loading(`Enviando ${selecionadas.length} nota(s) para cancelamento...`, { id: "cancelamento" });

    const perfil = JSON.parse(localStorage.getItem("perfil"));

    // Monta payload com os dados corretos
    const payload = notas
      .filter((nf) => selecionadas.includes(nf.id))
      .map((nf) => ({
        numero_nota: nf.numero_nf,
        transportadora_id: perfil?.transportadora_id,
        perfil_id: perfil?.user_id,
        data_cancelamento: new Date(),
        status_cancelamento: "solicitado",
        data_emissao: nf.data_envio,
        transportadora_nome: nf.transportadora_nome,
        fazenda: nf.fazenda,
        estado: nf.estado
      }));

    try {
      // 1. Insere na tabela de notas canceladas
      const { error: insertError } = await supabase
        .from("documentos_notas_canceladas")
        .insert(payload);

      if (insertError) {
        toast.error("Erro ao solicitar cancelamento", { id: "cancelamento" });
        console.error("Erro Supabase (insert):", insertError);
        return;
      }

      // 2. Remove da tabela original por ID (uuid)
      const { error: deleteError } = await supabase
        .from("documentos_notas")
        .delete()
        .in("id", selecionadas);

      if (deleteError) {
        toast.error("Cancelamento inserido, mas houve erro ao remover da tabela original", { id: "cancelamento" });
        console.error("Erro Supabase (delete):", deleteError);
      } else {
        toast.success(`✅ ${selecionadas.length} nota(s) enviada(s) para cancelamento com sucesso!`, { id: "cancelamento" });
      }

      // 3. Atualiza front-end
      onClear();
      onRemoveNotas(selecionadas);
    } catch (error) {
      toast.error("Erro inesperado durante o cancelamento", { id: "cancelamento" });
      console.error("Erro geral:", error);
    }
  };

  if (selecionadas.length === 0) return null;

  return (
    <button
      onClick={enviarCancelamento}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 transition-colors"
      title={`Enviar ${selecionadas.length} nota(s) para cancelamento`}
    >
      <FaExclamationTriangle />
      <FaTrash />
      Cancelar ({selecionadas.length})
    </button>
  );
};

export default BotaoCancelarNotas;
