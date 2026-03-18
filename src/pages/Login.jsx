import { useState } from "react";
import { HiOutlineArrowRight, HiOutlineLockClosed, HiOutlineUserCircle } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const highlights = [
  "Centraliza solicitações e retornos das transportadoras.",
  "Reduz cobrança manual no fechamento mensal.",
  "Dá visibilidade para financeiro, jurídico e operação.",
];

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
      toast.error(`Erro ao entrar: ${error.message}`);
      return;
    }

    const user = data.user;
    const { data: perfil } = await supabase.from("perfis").select("*").eq("user_id", user.id).single();

    if (!perfil) {
      toast.error("Perfil não encontrado.");
      return;
    }

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("perfil", JSON.stringify(perfil));

    toast.success("Login realizado com sucesso.");
    navigate("/selecao");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl items-center justify-center">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel animate-fade-in-up rounded-[32px] px-7 py-8 md:px-10 md:py-10">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-[#d9ead8] px-4 py-1 text-xs font-bold uppercase tracking-[0.28em] text-[#2e6f46]">
              Emissão e controle
            </span>

            <h2 className="section-title mt-5 text-4xl font-black leading-tight md:text-5xl">
              Gestão de notas de transporte com mais rastreabilidade e menos ruído operacional.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg">
              Uma operação única para solicitar, acompanhar e cobrar o retorno fiscal das transportadoras com
              contexto claro para o fechamento mensal.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/70 bg-white/80 px-4 py-4 text-sm font-medium leading-6 text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel animate-fade-in-up rounded-[32px] px-6 py-8 md:px-8 md:py-10">
          <form onSubmit={handleLogin} className="mx-auto max-w-md space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Acesso seguro</p>
              <h3 className="section-title mt-2 text-3xl font-black">Entrar na plataforma</h3>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Email corporativo</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <HiOutlineUserCircle className="text-xl text-[#1f5f95]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent text-slate-800 outline-none"
                  placeholder="email@empresa.com"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-600">Senha</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <HiOutlineLockClosed className="text-xl text-[#1f5f95]" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="w-full bg-transparent text-slate-800 outline-none"
                  placeholder="Digite sua senha"
                />
              </div>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123b68] px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#0f3259] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={carregando}
            >
              {carregando ? "Carregando..." : "Entrar no sistema"}
              {!carregando && <HiOutlineArrowRight className="text-lg" />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
