import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";





const ModalSolicitarNota = ({ transportadoraId, onClose }) => {
  const [form, setForm] = useState({
    tipo_pedido: "",
    quantidade_nfs: "",
    observacao: "",
  });

  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [fazendas, setFazendas] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const session = supabase.auth.getSession();
  const user = session?.data?.session?.user;

  useEffect(() => {
    const carregarFazendas = async () => {
      const { data, error } = await supabase.from("fazendas").select("*");
      if (!error) setFazendas(data);
      else console.error("Erro ao buscar fazendas:", error);
    };

    const perfilStorage = JSON.parse(localStorage.getItem("perfil"));
    setPerfil(perfilStorage);

    carregarFazendas();
  }, []);
  
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Erro ao obter usuário:", error);
      } else {
        setPerfil((prev) => ({ ...prev, id: data.user.id }));
      }
    };

    getUser();
  }, []);

  const handleSubmit = async () => {
    if (!form.tipo_pedido || !form.quantidade_nfs || !fazendaSelecionada) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    const { error } = await supabase.from("pedidos_notas").insert([
      {
        transportadora_id: transportadoraId,
        fazenda_id: parseInt(fazendaSelecionada),
        user_id: perfil?.id,
        quantidade_nfs: form.quantidade_nfs,
        tipo_pedido: form.tipo_pedido,
        observacao: form.observacao,
      },
    ]);

    if (error) {
      toast.error("Erro ao solicitar nota.");
      console.error(error);
    } else {
      toast.success("Solicitação enviada com sucesso!");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Solicitar Nota Fiscal</h2>

        {/* Tipo de Pedido */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Tipo de Pedido</label>
          <select
            className="w-full p-2 border rounded"
            value={form.tipo_pedido}
            onChange={(e) =>
              setForm({ ...form, tipo_pedido: e.target.value })
            }
          >
            <option value="">Selecione</option>
            <option value="normal">Normal</option>
            <option value="reentrega">Reentrega</option>
            <option value="complementar">Complementar</option>
          </select>
        </div>

        {/* Fazenda */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fazenda</label>
          <select
            value={fazendaSelecionada}
            onChange={(e) => setFazendaSelecionada(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Selecione a fazenda</option>
            {fazendas.map((fazenda) => (
              <option key={fazenda.id} value={fazenda.id}>
                {fazenda.nome} ({fazenda.estado})
              </option>
            ))}
          </select>
        </div>

        {/* Quantidade */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Quantidade de NFs</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={form.quantidade_nfs}
            onChange={(e) =>
              setForm({ ...form, quantidade_nfs: e.target.value })
            }
          />
        </div>

        {/* Observação */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Observação</label>
          <textarea
            className="w-full p-2 border rounded"
            rows={3}
            value={form.observacao}
            onChange={(e) =>
              setForm({ ...form, observacao: e.target.value })
            }
          />
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Solicitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalSolicitarNota;
