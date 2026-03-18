import { FaClipboardList, FaFileSignature } from "react-icons/fa";

const PainelHeader = ({ logo, title, onCancelar, onPedidos }) => {
  return (
    <div className="glass-panel mb-6 flex flex-col justify-between gap-5 rounded-[30px] px-5 py-5 md:flex-row md:items-center md:px-7">
      <div className="flex items-center gap-4">
        <div className="rounded-[24px] border border-slate-100 bg-white p-3 shadow-sm">
          <img src={logo} alt={title} className="h-14 w-14 rounded-2xl object-contain" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Painel operacional</p>
          <h1 className="section-title mt-1 text-3xl font-black">{title}</h1>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {onCancelar && (
          <button
            onClick={onCancelar}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#b98529] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#9f7223]"
          >
            <FaClipboardList />
            Notas a Cancelar
          </button>
        )}

        {onPedidos && (
          <button
            onClick={onPedidos}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#123b68] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0f3259]"
          >
            <FaFileSignature />
            Pedidos
          </button>
        )}
      </div>
    </div>
  );
};

export default PainelHeader;
