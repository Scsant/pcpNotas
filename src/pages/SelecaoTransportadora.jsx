import { useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowTrendingUp,
  HiOutlineBuildingOffice2,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentDuplicate,
  HiOutlineExclamationTriangle,
  HiOutlineHomeModern,
  HiOutlineTruck,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import GlobalHeader from "../components/GlobalHeader";

const logos = [
  { id: 1, nome: "Cargo Polo", src: "/rectangle-70.png" },
  { id: 8, nome: "VDA", src: "/rectangle-140.png" },
  { id: 2, nome: "Garbuio", src: "/rectangle-90.png" },
  { id: 5, nome: "JSL", src: "/rectangle-100.png" },
  { id: 4, nome: "TransOlsen", src: "/rectangle-110.png" },
  { id: 6, nome: "Placidos", src: "/rectangle-120.png" },
  { id: 7, nome: "Serranalog", src: "/rectangle-130.png" },
  { id: 3, nome: "Nepomuceno", src: "/rectangle-80.png" },
];

const adminActions = [
  {
    label: "PCP Notas",
    hint: "Solicitação e histórico operacional",
    route: "/home",
    icon: HiOutlineHomeModern,
  },
  {
    label: "Painel de Notas",
    hint: "Consulta, filtros e acompanhamento",
    route: "/painel-notas",
    icon: HiOutlineDocumentDuplicate,
  },
  {
    label: "Notas a Cancelar",
    hint: "Pendências críticas para saneamento",
    route: "/notas-canceladas",
    icon: HiOutlineExclamationTriangle,
  },
  {
    label: "Upload de Notas",
    hint: "Entrada massiva e extração de dados",
    route: "/upload-notas",
    icon: HiOutlineCloudArrowUp,
  },
];

const SelecaoTransportadora = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [bemVindo, setBemVindo] = useState(false);

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem("perfil"));
    if (!p) {
      return;
    }

    setPerfil(p);
    setBemVindo(true);

    const timer = setTimeout(() => setBemVindo(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const isAdmin = perfil?.role === "admin";
  const boasVindasNome = perfil?.transportadora_nome || (isAdmin ? "Administrador" : "Usuário");

  const cardsLiberados = useMemo(() => {
    if (!perfil) {
      return 0;
    }

    return logos.filter((logo) => isAdmin || perfil.transportadora_id === logo.id).length;
  }, [isAdmin, perfil]);

  const podeAcessar = (id) => isAdmin || perfil?.transportadora_id === id;

  const handleClick = (id) => {
    if (!podeAcessar(id)) {
      return;
    }

    navigate(`/painel-transportadora/${id}`);
  };

  if (!perfil) {
    return (
      <div className="glass-panel flex min-h-[70vh] items-center justify-center rounded-[32px] text-lg font-semibold text-slate-600">
        Carregando ambiente operacional...
      </div>
    );
  }

  return (
    <div className="relative">
      <GlobalHeader />

      {bemVindo && (
        <div
          className="animate-fade-in-up fixed inset-0 z-40 flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: "url('/imagens/imgBracell.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#0b2440]/70" />
          <div className="relative z-10 mx-6 max-w-2xl rounded-[32px] border border-white/20 bg-white/12 px-8 py-10 text-center text-white backdrop-blur-md">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Acesso liberado</p>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">Bem-vindo, {boasVindasNome}</h2>
            <p className="mt-4 text-base leading-7 text-white/85">
              Seu ambiente foi carregado com os fluxos de solicitação, conferência e acompanhamento de notas.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 md:p-7">
          <div className="rounded-[28px] bg-[#123b68] px-5 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Visão do usuário</p>
            <h2 className="mt-3 text-2xl font-black">{isAdmin ? "Gestão central" : "Portal da transportadora"}</h2>
            <p className="mt-3 text-sm leading-6 text-white/80">
              {isAdmin
                ? "Controle centralizado de solicitações, uploads e saneamento fiscal."
                : "Acompanhe e responda apenas as notas vinculadas à sua operação."}
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Usuário logado</p>
              <p className="mt-2 text-lg font-bold text-slate-800">{boasVindasNome}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Transportadoras visíveis</p>
              <p className="mt-2 text-3xl font-black text-[#123b68]">{cardsLiberados}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Atalhos administrativos</p>
              {adminActions.map(({ label, hint, route, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate(route)}
                  className="flex w-full items-start gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[#cfe0ef] hover:shadow-md"
                >
                  <span className="mt-0.5 rounded-2xl bg-[#e7f0f9] p-2 text-[#123b68]">
                    <Icon className="text-lg" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800">{label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="glass-panel rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.82)] p-6 text-slate-900 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Central operacional</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#16304f] md:text-4xl">
                Sistema de Gestão de Notas Fiscais
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Acesse a operação por transportadora e acompanhe o ciclo completo da solicitação até o retorno do
                documento fiscal.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Modelo</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <HiOutlineArrowTrendingUp className="text-[#3b8f59]" />
                  Operação rastreável
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {logos.map((logo) => {
              const liberado = podeAcessar(logo.id);

              return (
                <button
                  key={logo.id}
                  type="button"
                  onClick={() => handleClick(logo.id)}
                  disabled={!liberado}
                  className={`group rounded-[30px] border p-5 text-left transition ${
                    liberado
                      ? "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] shadow-[0_18px_40px_rgba(15,35,60,0.10)] hover:-translate-y-1 hover:border-[#b8d1e7] hover:shadow-[0_24px_50px_rgba(15,35,60,0.16)]"
                      : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-3xl bg-[#edf4fb] p-3 text-[#123b68]">
                      {isAdmin ? <HiOutlineBuildingOffice2 className="text-xl" /> : <HiOutlineTruck className="text-xl" />}
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                        liberado ? "bg-[#cfe8d1] text-[#24583a]" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {liberado ? "Acesso liberado" : "Restrito"}
                    </span>
                  </div>

                  <div className="mt-5 flex h-24 items-center justify-center rounded-[24px] border border-slate-200 bg-white px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <img src={logo.src} alt={logo.nome} className="max-h-full max-w-full object-contain" />
                  </div>

                  <div className="mt-5">
                    <h3 className="text-lg font-black text-[#1c2f47]">{logo.nome}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {liberado
                        ? "Entrar no painel para acompanhar pedidos, retorno fiscal e pendências."
                        : "Disponível apenas para o perfil vinculado ou para a equipe administradora."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SelecaoTransportadora;
