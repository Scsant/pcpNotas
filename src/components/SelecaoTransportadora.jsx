import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const logos = [
  { id: 1, nome: "CargoPolo", src: "/rectangle-70.png" },
  { id: 2, nome: "EN", src: "/rectangle-80.png" },
  { id: 3, nome: "Garbúio", src: "/rectangle-90.png" },
  { id: 4, nome: "JSL", src: "/rectangle-100.png" },
  { id: 5, nome: "TransOlsen", src: "/rectangle-110.png" },
  { id: 6, nome: "Plácido", src: "/rectangle-120.png" },
  { id: 7, nome: "Serranalog", src: "/rectangle-130.png" },
  { id: 8, nome: "VDA", src: "/rectangle-140.png" },
];

const SelecaoTransportadora = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("perfil"));
    setPerfil(p);
  }, []);

  if (!perfil) return null;

  const podeAcessar = (id) =>
    perfil.role === "admin" || perfil.transportadora_id === id;

  const handleClick = (id) => {
    if (podeAcessar(id)) {
      navigate("/home");
    }
  };

  return (
    <div
      className="h-screen w-full flex"
      style={{
        background: "radial-gradient(closest-side, #82d9b6 0%, #1d2d6d 100%)",
      }}
    >
      {/* Sidebar */}
      <aside className="w-[250px] bg-[#2c303b] p-6 text-white flex flex-col gap-6">
        <img src="/ellipse-10.png" className="w-[140px] mb-4" />
        <h1 className="text-2xl font-black text-blue-400">Bracell</h1>
        <p className="text-sm font-semibold">SISTEMA DE GESTÃO DE NFs</p>

        <button className="bg-[#d9d9d9] text-black py-2 rounded font-bold">
          CONTROLE
        </button>
        <button className="bg-[#d9d9d9] text-black py-2 rounded font-bold">
          CHEGADA
        </button>
        <button className="bg-[#d9d9d9] text-black py-2 rounded font-bold">
          SAÍDA
        </button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-12 flex flex-col items-center gap-6">
        <div className="text-3xl font-black text-white tracking-wide mb-6">
          SISTEMA DE GESTÃO DE NOTAS FISCAIS
        </div>

        <div className="grid grid-cols-4 gap-10">
          {logos.map((logo) => (
            <div
              key={logo.id}
              onClick={() => handleClick(logo.id)}
              className={`w-[220px] h-[200px] rounded-[65px] overflow-hidden shadow-md cursor-pointer transition hover:scale-105 ${
                !podeAcessar(logo.id)
                  ? "opacity-30 pointer-events-none"
                  : "bg-white"
              }`}
            >
              <img
                src={logo.src}
                alt={logo.nome}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SelecaoTransportadora;
