import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
  
    setCarregando(false);
  
    if (error) {
      toast.error("❌ Erro ao entrar: " + error.message);
      return;
    }
  
    const user = data.user;
  
    // Buscar perfil
    const { data: perfil, error: erroPerfil } = await supabase
      .from("perfis")
      .select("*")
      .eq("user_id", user.id)
      .single();
  
    if (!perfil) {
      toast.error("⚠️ Perfil não encontrado!");
      return;
    }
  
    // ✅ SALVAR NO LOCALSTORAGE
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("perfil", JSON.stringify(perfil));
  
    toast.success("✅ Login realizado!");
  
    // ✅ Redirecionar para a rota correta
    navigate(perfil.role === "admin" ? "/selecao" : "/selecao");
  };
  
  

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0070C0] to-[#00B050] flex justify-center items-center p-6">
      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-md shadow-lg p-8 rounded-xl max-w-md w-full space-y-6 border border-white/20"
      >
        <div className="text-center text-white font-bold text-2xl">🔐 LOGIN</div>

        <div>
          <label className="block text-white mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded bg-white text-black placeholder-gray-500"
            placeholder="email@exemplo.com"
          />
        </div>

        <div>
          <label className="block text-white mb-1">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="w-full px-4 py-2 rounded bg-white text-black placeholder-gray-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition"
          disabled={carregando}
        >
          {carregando ? "Carregando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
};

export default Login;
