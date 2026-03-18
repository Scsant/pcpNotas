import { useState } from "react";
import { HiOutlineArrowDownTray, HiOutlineEye, HiOutlineLockClosed } from "react-icons/hi2";
import { supabase } from "../supabaseClient";

const inputClassName = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none";

const statusClassName = {
  pendente: "bg-amber-100 text-amber-800",
  vinculada: "bg-emerald-100 text-emerald-800",
  em_transito: "bg-sky-100 text-sky-800",
  concluido: "bg-slate-200 text-slate-700",
  cancelado: "bg-rose-100 text-rose-700",
};

const NotaLinha = ({ nota, podeEditar, salvarEdicao, selecionada, toggleSelecionada }) => {
  const [edicao, setEdicao] = useState({
    cte: nota.cte || "",
    placa: nota.placa || "",
    observacao: nota.observacao || "",
    status: nota.status || "pendente",
  });

  const baixarPDF = async (url, nomeArquivo) => {
    try {
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
    } catch (err) {
      console.error("Erro no download:", err);
    }
  };

  const publicUrl = supabase.storage.from("notas").getPublicUrl(nota.url).data?.publicUrl || "";
  const statusKey = nota.status?.toLowerCase().trim() || "pendente";

  return (
    <tr className={`border-b border-slate-100 align-top transition hover:bg-slate-50 ${selecionada ? "bg-emerald-50" : ""}`}>
      <td className="px-3 py-4 text-center">
        <input type="checkbox" checked={selecionada} onChange={() => toggleSelecionada(nota.id)} />
      </td>

      <td className="px-3 py-4 font-semibold text-slate-800">{nota.numero_nf}</td>
      <td className="px-3 py-4 text-slate-700">{nota.nome_arquivo}</td>
      <td className="px-3 py-4 text-slate-700">{nota.transportadora_nome}</td>
      <td className="px-3 py-4 text-slate-700">{nota.fazenda}</td>
      <td className="px-3 py-4 text-slate-700">{nota.estado}</td>

      <td className="px-3 py-4">
        {podeEditar ? (
          <input
            value={edicao.cte}
            onChange={(e) => setEdicao((prev) => ({ ...prev, cte: e.target.value }))}
            className={inputClassName}
          />
        ) : (
          <span className="text-slate-700">{nota.cte}</span>
        )}
      </td>

      <td className="px-3 py-4">
        {podeEditar ? (
          <input
            value={edicao.placa}
            onChange={(e) => setEdicao((prev) => ({ ...prev, placa: e.target.value.toUpperCase() }))}
            className={inputClassName}
          />
        ) : (
          <span className="text-slate-700">{nota.placa}</span>
        )}
      </td>

      <td className="px-3 py-4">
        {podeEditar ? (
          <input
            value={edicao.observacao}
            onChange={(e) => setEdicao((prev) => ({ ...prev, observacao: e.target.value }))}
            className={inputClassName}
          />
        ) : (
          <span className="text-slate-700">{nota.observacao}</span>
        )}
      </td>

      <td className="px-3 py-4 text-slate-700">{new Date(nota.data_envio).toLocaleDateString("pt-BR")}</td>

      <td className="px-3 py-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusClassName[statusKey] || "bg-slate-100 text-slate-700"}`}>
          {nota.status}
        </span>
      </td>

      <td className="px-3 py-4">
        <div className="flex min-w-[140px] flex-col items-start gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f5f95] transition hover:text-[#123b68]"
            title="Visualizar PDF"
          >
            <HiOutlineEye />
            Ver PDF
          </a>

          {statusKey === "vinculada" ? (
            <button
              type="button"
              onClick={() => baixarPDF(nota.url, nota.nome_arquivo)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
              title="Baixar PDF"
            >
              <HiOutlineArrowDownTray />
              Baixar PDF
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400" title="PDF indisponível">
              <HiOutlineLockClosed />
              Indisponível
            </span>
          )}
        </div>
      </td>

      <td className="px-3 py-4">
        {podeEditar && (
          <button
            type="button"
            onClick={() => salvarEdicao(nota.id, edicao)}
            className="rounded-xl bg-[#123b68] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f3259]"
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
