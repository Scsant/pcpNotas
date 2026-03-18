import PedidosQueue from "./PedidosQueue";

const PedidosTransportadoraModal = ({ perfil, transportadoraId, reloadToken = 0, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-2 sm:p-4">
      <div className="glass-panel flex max-h-[calc(100vh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] sm:max-h-[calc(100vh-2rem)] sm:rounded-[32px]">
        <div className="flex items-center justify-end border-b border-slate-200/70 px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Fechar
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <PedidosQueue
            perfil={perfil}
            transportadoraId={transportadoraId}
            title="Pedidos da transportadora"
            description="Acompanhe pendentes no topo, consulte os atendidos recentes e registre novas solicitações sem sair da rotina de notas."
            compact
            showCreateButton
            allowAttend={false}
            reloadToken={reloadToken}
            variant="modal"
          />
        </div>
      </div>
    </div>
  );
};

export default PedidosTransportadoraModal;
