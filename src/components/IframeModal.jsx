import { useEffect } from "react";

const IframeModal = ({ url, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex justify-center items-center">
      <div className="relative w-[90%] h-[90%] bg-white rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Fechar
        </button>
        <iframe
          src={url}
          title="Conteúdo"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

export default IframeModal;
