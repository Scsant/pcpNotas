import { useState } from "react";
import { supabase } from "../supabaseClient";

const NotaLinha = ({ nota, podeEditar, salvarEdicao, selecionada, toggleSelecionada }) => {
  const [edicao, setEdicao] = useState({
    cte: nota.cte || "",
    placa: nota.placa || "",
    observacao: nota.observacao || "",
    status: nota.status || "pendente",
  });

  const baixarPDF = async (url, nomeArquivo) => {
    const { data, error } = await supabase.storage.from("notas").download(url);
    if (error) {
      console.error("Erro ao baixar PDF:", error.message);
      return;
    }

    const blobUrl = window.URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = nomeArquivo || "nota.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  return (
    <tr className={`text-center border-b hover:bg-gray-100 ${selecionada ? "bg-green-100" : ""}`}>
      {/* Seleção */}
      <td className="px-2 py-2">
        <input
          type="checkbox"
          checked={selecionada}
          onChange={() => toggleSelecionada(nota.id)}
        />
      </td>

      {/* Dados básicos */}
      <td className="px-3 py-2 text-gray-800">{nota.numero_nf}</td>
      <td className="px-3 py-2 text-gray-800">{nota.nome_arquivo}</td>
      <td className="px-3 py-2 text-gray-800">{nota.transportadora_nome}</td>
      <td className="px-3 py-2 text-gray-800">{nota.fazenda}</td>
      <td className="px-3 py-2 text-gray-800">{nota.estado}</td>

      {/* CTE */}
      <td className="px-2 py-2">
        {podeEditar ? (
          <input
            value={edicao.cte}
            onChange={(e) => setEdicao((prev) => ({ ...prev, cte: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm text-black"
          />
        ) : nota.cte}
      </td>

      {/* Placa */}
      <td className="px-2 py-2">
        {podeEditar ? (
          <input
            value={edicao.placa}
            onChange={(e) =>
              setEdicao((prev) => ({ ...prev, placa: e.target.value.toUpperCase() }))
            }
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm text-black"
          />
        ) : nota.placa}
      </td>

      {/* Observação */}
      <td className="px-2 py-2">
        {podeEditar ? (
          <input
            value={edicao.observacao}
            onChange={(e) => setEdicao((prev) => ({ ...prev, observacao: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 w-full text-sm text-black"
          />
        ) : nota.observacao}
      </td>

      {/* Data */}
      <td className="px-2 py-2 text-gray-800">
        {new Date(nota.data_envio).toLocaleDateString("pt-BR")}
      </td>

      {/* Status */}
      <td className="px-2 py-2">
        <span className="capitalize text-gray-800 font-semibold">{nota.status}</span>
      </td>

      {/* PDF */}
      <td className="px-2 py-2">
        <div className="flex flex-col items-center gap-1">
          <a
            href={`https://prbmfjfgzjoqhfeefgxp.supabase.co/storage/v1/object/public/${nota.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition"
            title="Visualizar PDF"
          >
            📄 Ver PDF
          </a>

          {nota.status?.toLowerCase().trim() === "vinculada" ? (
            <button
              type="button"
              onClick={() => baixarPDF(nota.url, nota.nome_arquivo)}
              className="text-green-600 hover:text-green-800 underline text-sm transition"
              title="Baixar PDF"
            >
              📥 Baixar PDF
            </button>
          ) : (
            <span className="text-gray-400 italic text-xs" title="PDF indisponível">
              ⛔ Indisponível
            </span>
          )}
        </div>
      </td>

      {/* Salvar */}
      <td className="px-2 py-2">
        {podeEditar && (
          <button
            type="button"
            onClick={() => salvarEdicao(nota.id, edicao)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded shadow"
            title="Salvar alterações"
          >
            Salvar
          </button>
        )}
      </td>
    </tr>
  );
};

export default NotaLinha;
