import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

function Header() {
  return (
    <header className="mb-6 md:mb-8">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-white/60 bg-[rgba(255,255,255,0.82)] px-5 py-4 md:px-7">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <img src="/imagens/bracell_logo_FA.png" alt="Bracell" className="h-10 w-auto md:h-12" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Plataforma Operacional
            </p>
            <h1 className="section-title text-lg font-black md:text-2xl">
              PCP Notas de Transporte
            </h1>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 md:flex">
          <HiOutlineBuildingOffice2 className="text-base text-[#1f5f95]" />
          Gestão, solicitação e rastreabilidade fiscal
        </div>
      </div>
    </header>
  );
}

export default Header;
