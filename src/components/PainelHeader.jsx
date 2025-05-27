import { FaClipboardList, FaFileSignature } from "react-icons/fa";

const PainelHeader = ({ logo, title, onCancelar, onSolicitar }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <img src={logo} alt="Logo" className="h-16 w-16 rounded-lg" />
        <h1 className="text-3xl font-black text-white">{title}</h1>
      </div>

      <div className="flex gap-3 mt-4 md:mt-0">
        {onCancelar && (
          <button
            onClick={onCancelar}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow"
          >
            <FaClipboardList /> Notas a Cancelar
          </button>
        )}

        <button
          onClick={onSolicitar}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
        >
          <FaFileSignature /> Solicitar Nota
        </button>
      </div>
    </div>
  );
};

export default PainelHeader;
