import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalHeader from "../components/GlobalHeader";



const logos = [
  { id: 1, nome: "CargoPolo", src: "/rectangle-70.png" },
  { id: 8, nome: "VDA", src: "/rectangle-140.png" },
  { id: 2, nome: "Garbúio", src: "/rectangle-90.png" },
  { id: 5, nome: "JSL", src: "/rectangle-100.png" },
  { id: 4, nome: "TransOlsen", src: "/rectangle-110.png" },
  { id: 6, nome: "Plácido", src: "/rectangle-120.png" },
  { id: 7, nome: "Serranalog", src: "/rectangle-130.png" },
  { id: 3, nome: "EN", src: "/rectangle-80.png" },
];

const SelecaoTransportadora = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [bemVindo, setBemVindo] = useState(false);

  useEffect(() => {
    const carregarPerfil = async () => {
      const p = JSON.parse(localStorage.getItem("perfil"));
      if (p) {
        setPerfil(p);
        setBemVindo(true);
  
        // 1️⃣ Espera 2 segundos para exibir a tela de boas-vindas
        setTimeout(() => {
          setBemVindo(false);
  
          // 2️⃣ Redireciona após ocultar a tela de boas-vindas
          navigate("/selecao"); // ou /selecao ou outro destino
        }, 2000); // tempo de boas-vindas
      }
    };
    carregarPerfil();
  }, [navigate]);
  

  if (!perfil) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#1d2d6d] text-white text-2xl font-bold">
        Carregando...
        <div className="ml-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (bemVindo) {
    return (
      <div
        className="h-screen w-full bg-cover bg-center flex items-center justify-center relative animate-fade-in"
        style={{
          backgroundImage: "url('/imagens/imgBracell.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
  
        <div className="relative z-10 text-white text-4xl font-bold text-center">
          Bem-vindo,{" "}
          {perfil.transportadora_nome ||
            (perfil.role === "admin" ? "Administrador" : "Usuário")}
          !
        </div>
      </div>
    );
  }
  

  const isAdmin = perfil.role === "admin";
  const podeAcessar = (id) =>
    perfil.role === "admin" || perfil.transportadora_id === id;

  const handleClick = (id) => {
    if (!podeAcessar(id)) return;
  
    if (id === 1) {
      navigate("/painel-transportadora/1");
      return;
    }
  
    if (id === 2) {
      navigate("/painel-transportadora/2");
      return;
    }

    if (id === 3) {
      navigate("/painel-transportadora/3");
      return;
    }

    if (id === 4) {
      navigate("/painel-transportadora/4");
      return;
    }

    if (id === 5) {
      navigate("/painel-transportadora/5");
      return;
    }

    if (id === 6) {
      navigate("/painel-transportadora/6");
      return;
    }

    if (id === 7) {
      navigate("/painel-transportadora/7");
      return;
    }

    if (id === 8) {
      navigate("/painel-transportadora/8");
      return;
    }
  
    navigate("/home"); // fallback genérico
  };
  
return (
  <div
    className="min-h-screen w-full flex flex-col lg:flex-row"
    style={{
      background: "radial-gradient(closest-side, #82d9b6 0%, #1d2d6d 100%)",
    }}
  >
    <GlobalHeader />

    {/* Sidebar */}
    <aside
      className={`w-full lg:w-[250px] bg-[#2c303b] p-6 text-white flex flex-col gap-4 lg:gap-6 transition-all duration-300 ${
        !isAdmin ? "opacity-30 pointer-events-none blur-sm" : ""
      }`}
    >
      <img src="/ellipse-10.png" className="w-[120px] mx-auto mb-4" />

      <p className="text-sm font-semibold text-center lg:text-left">
        SISTEMA DE GESTÃO DE NFs
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate("/home")}
          className="bg-[#d9d9d9] text-black py-2 rounded font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:bg-blue-400 active:scale-95 shadow-md hover:shadow-lg"
        >
          PCP NOTAS
        </button>
        <button
          onClick={() => navigate("/painel-notas")}
          className="bg-[#d9d9d9] text-black py-2 rounded font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:bg-blue-400 active:scale-95 shadow-md hover:shadow-lg"
        >
          PAINEL NOTAS
        </button>
        <button
          onClick={() => navigate("/notas-canceladas")}
          className="bg-[#d9d9d9] text-black py-2 rounded font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:bg-blue-400 active:scale-95 shadow-md hover:shadow-lg"
        >
          NOTAS A CANCELAR
        </button>
        <button
          onClick={() => navigate("/upload-notas")}
          className="bg-[#d9d9d9] text-black py-2 rounded font-bold text-sm transition-all duration-300 transform hover:scale-105 hover:bg-blue-400 active:scale-95 shadow-md hover:shadow-lg"
        >
          UPLOAD NOTAS
        </button>
      </div>
    </aside>

    {/* Conteúdo */}
    <main className="flex-1 p-6 sm:p-8 md:p-12 flex flex-col items-center gap-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white text-center tracking-wide">
        SISTEMA DE GESTÃO DE NOTAS FISCAIS
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8">
        {logos.map((logo) => (
          <div
            key={logo.id}
            onClick={() => handleClick(logo.id)}
            className={`w-full aspect-[1/1] max-w-[180px] sm:max-w-[200px] md:max-w-[220px] rounded-[35px] overflow-hidden shadow-md cursor-pointer transition-all duration-300 transform ${
              !podeAcessar(logo.id)
                ? "opacity-30 pointer-events-none blur-[1px]"
                : "bg-white hover:scale-105 hover:shadow-2xl active:scale-95"
            }`}
          >
            <img
              src={logo.src}
              alt={logo.nome}
              className="w-full h-full object-contain"
            />
          </div>
        ))}
      </div>
    </main>
  </div>
);
};
export default SelecaoTransportadora;
