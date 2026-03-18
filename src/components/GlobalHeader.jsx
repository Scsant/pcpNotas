import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { supabase } from "../supabaseClient";

const GlobalHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("perfil");
    navigate("/login");
  };

  return (
    <div className="absolute right-5 top-5 z-50 md:right-8 md:top-8">
      <button
        onClick={handleLogout}
        className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
      >
        <FiLogOut className="text-base text-[#b54242]" />
        Sair
      </button>
    </div>
  );
};

export default GlobalHeader;
