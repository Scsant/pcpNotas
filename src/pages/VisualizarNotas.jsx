import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";

const VisualizarNotas = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transportadoraId, setTransportadoraId] = useState(null);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Usuário não autenticado!");
          return;
        }

        // 🛡️ Pegando perfil para buscar transportadora
        const { data: perfil, error: perfilError } = await supabase
          .from("perfis")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (perfilError) {
          console.error(perfilError);
          toast.error("Erro ao buscar perfil.");
          return;
        }

        setTransportadoraId(perfil.transportadora_id);

        const { data, error } = await supabase
          .from("documentos_notas")
          .select("*")
          .eq("transportadora_id", perfil.transportadora_id);

        if (error) {
          console.error(error);
          toast.error("Erro ao carregar notas");
        } else {
          setNotas(data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro inesperado ao carregar notas");
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, []);

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Notas Fiscais Enviadas</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : notas.length === 0 ? (
        <p>Nenhuma nota enviada.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg text-black">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Arquivo</th>
                <th className="px-4 py-2 text-left">Visualizar</th>
                <th className="px-4 py-2 text-left">Excluir</th>
              </tr>
            </thead>
            <tbody>
              {notas.map((nota) => (
                <tr key={nota.id} className="border-t">
                  <td className="px-4 py-2">{nota.nome_arquivo}</td>
                  <td className="px-4 py-2">
                    <a
                      href={`https://prbmfjfgzjqohfeefgxp.supabase.co/storage/v1/object/public/${nota.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Abrir PDF
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    {/* Opcional: botar um botão de deletar se quiser */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VisualizarNotas;
