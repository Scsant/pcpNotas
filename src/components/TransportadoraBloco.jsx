import { useState } from "react";
import { HiOutlineClipboardDocument, HiOutlineTrash } from "react-icons/hi2";
import toast from "react-hot-toast";

const transportadoras = [
  "Cargo Polo",
  "Garbuio",
  "JSL",
  "Nepomuceno",
  "VDA",
  "Olsen",
  "Serrana",
  "Placidos",
  "Bracell",
];

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#9fc0dc] focus:ring-2 focus:ring-[#d8e7f4]";

const TransportadoraBloco = ({ bloco, onChange, estado, onRemove }) => {
  const [chaveCopiadaId, setChaveCopiadaId] = useState(null);

  const chavesSeparadas = bloco.chaves?.trim().split("\n").filter(Boolean) || [];

  const copiarChave = async (chave, id) => {
    try {
      await navigator.clipboard.writeText(chave);
      setChaveCopiadaId(id);
      toast.success("Chave copiada.");
    } catch (err) {
      toast.error("Erro ao copiar chave.");
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/75 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Transportadora vinculada</p>
          <h4 className="mt-1 text-xl font-black text-slate-800">{bloco.transportadora || "Nova transportadora"}</h4>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-2 self-start rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <HiOutlineTrash />
          Remover
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Transportadora</span>
          <select
            className={fieldClassName}
            value={bloco.transportadora}
            onChange={(e) => onChange("transportadora", e.target.value)}
          >
            <option value="">Selecione</option>
            {transportadoras.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Quantidade de notas</span>
          <input
            type="number"
            className={fieldClassName}
            value={bloco.qtdNotas}
            onChange={(e) => onChange("qtdNotas", e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Nota inicial</span>
          <input
            type="number"
            className={fieldClassName}
            value={bloco.notaInicial}
            onChange={(e) => onChange("notaInicial", e.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-600">Nota final</span>
          <input
            type="number"
            className={fieldClassName}
            value={bloco.notaFinal}
            onChange={(e) => onChange("notaFinal", e.target.value)}
          />
        </label>
      </div>

      {estado === "MS" && (
        <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-600">Chaves de acesso</span>
            <textarea
              rows={4}
              className={`${fieldClassName} mt-2 resize-y`}
              placeholder="Cole as chaves, uma por linha"
              value={bloco.chaves}
              onChange={(e) => onChange("chaves", e.target.value)}
            />
          </label>

          <div className="mt-4 space-y-2">
            {chavesSeparadas.map((chave, idx) => {
              const id = `${bloco.notaInicial}-${idx}`;
              const isCopiada = chaveCopiadaId === id;

              return (
                <div
                  key={id}
                  className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
                    isCopiada ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className="break-all font-mono text-xs text-slate-700 md:text-sm">{chave}</span>
                  <button
                    type="button"
                    onClick={() => copiarChave(chave, id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                      isCopiada ? "bg-emerald-600 text-white" : "bg-[#123b68] text-white hover:bg-[#0f3259]"
                    }`}
                  >
                    <HiOutlineClipboardDocument />
                    {isCopiada ? "Copiada" : "Copiar"}
                  </button>
                </div>
              );
            })}

            {chavesSeparadas.length > 0 && (
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Total de chaves: {chavesSeparadas.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportadoraBloco;
