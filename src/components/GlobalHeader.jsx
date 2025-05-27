import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const GlobalHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("perfil"); // limpa perfil armazenado
    navigate("/login");
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold"
      >
        Sair
      </button>
    </div>
  );
};

export default GlobalHeader;
