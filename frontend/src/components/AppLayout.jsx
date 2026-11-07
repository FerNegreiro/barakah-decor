import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, Calendar, ChevronDown, Heart, LogOut, Menu, X } from "lucide-react";

import GlobalSearch from "./GlobalSearch";
import { encerrarSessao } from "../utils/auth";
import { getCurrentUser, getUserInitial } from "../utils/currentUser";
import { dataDeHoje } from "../utils/format";
import { menuDoUsuario } from "../utils/navigation";

export function PageCard({ children, className = "" }) {
  return (
    <section className={`rounded-[10px] border border-black/5 bg-white shadow-[0_8px_24px_rgba(20,38,31,0.08)] ${className}`}>
      {children}
    </section>
  );
}

export function Field({ className = "", ...props }) {
  return (
    <input
      className={`h-12 rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#006d3f] focus:ring-2 focus:ring-[#006d3f]/10 ${className}`}
      {...props}
    />
  );
}

export function SelectField({ children, className = "", ...props }) {
  return (
    <select
      className={`h-12 rounded-lg border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-[#006d3f] focus:ring-2 focus:ring-[#006d3f]/10 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#006d3f] px-5 text-sm font-bold text-white transition hover:bg-[#005a34] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AppLayout({ children, title = "Barakah Decor", subtitle }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getCurrentUser);
  const [alertCount, setAlertCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navSections = menuDoUsuario(currentUser);

  async function handleLogout() {
    await encerrarSessao();
    setUserMenuOpen(false);
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    async function carregarAlertas() {
      try {
        const response = await axios.get("http://127.0.0.1:8000/alertas/resumo");
        setAlertCount(Number(response.data?.total || 0));
      } catch {
        setAlertCount(0);
      }
    }

    carregarAlertas();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-[#08271f]">
      <aside className="group fixed left-0 top-0 z-40 hidden h-screen w-[88px] flex-col overflow-hidden bg-[#04241F] text-white shadow-2xl transition-[width] duration-300 hover:w-[300px] lg:flex">
        <div className="px-3 pb-5 pt-6 transition-all duration-300 group-hover:px-6">
          <div className="flex items-center justify-center gap-4 transition-all duration-300 group-hover:justify-start">
            <img src="/logo.png" alt="Barakah Decor" className="h-16 w-16 rounded-md object-contain" />
            <div className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-[170px] group-hover:opacity-100">
              <p className="text-2xl font-extrabold leading-6 text-[#e6ae28]">BARAKAH</p>
              <p className="text-2xl font-extrabold leading-7 text-[#e6ae28]">DECOR</p>
              <p className="mt-1 whitespace-nowrap text-[11px] text-white/75">{"Embalagens e Decorações"}</p>
            </div>
          </div>
        </div>

        <nav className="scrollbar-hidden flex-1 space-y-3 overflow-y-auto px-5 transition-all duration-300 group-hover:px-5">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex ? "border-t border-white/15 pt-3" : ""}>
              <div className="space-y-2">
                {section.map((item) => {
                  const Icon = item.icon;
                  const itemBadge = item.to === "/alertas" ? alertCount : item.badge;
                  return (
                    <NavLink
                      key={item.to}
                      title={item.label}
                      to={item.to}
                      className={({ isActive }) =>
                        `relative mx-auto grid h-11 w-11 grid-cols-[44px_1fr_auto] items-center rounded-lg text-[15px] font-semibold transition-all duration-300 group-hover:mx-0 group-hover:h-12 group-hover:w-full group-hover:grid-cols-[48px_1fr_auto] ${
                          isActive ? "bg-gradient-to-r from-[#f0c04c] to-[#cf9c2d] text-white shadow-lg" : "text-white hover:bg-white/8"
                        }`
                      }
                    >
                      <span className="grid h-11 w-11 place-items-center group-hover:h-12 group-hover:w-12">
                        <Icon size={20} />
                      </span>
                      <span className="w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:w-auto group-hover:opacity-100">{item.label}</span>
                      {Number(itemBadge) > 0 ? (
                        <span className="mr-4 grid h-6 min-w-6 place-items-center rounded-full bg-[#e2a827] px-2 text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          {itemBadge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-5 pb-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="relative min-h-[156px] overflow-hidden rounded-[10px] border border-white/20 bg-[#04241F] p-4">
            <p className="relative z-10 w-32 text-[13px] font-semibold leading-5 text-white">
              {"Organize seu estoque e faça seu negócio decorar ainda mais momentos."}
            </p>
            <div className="absolute right-2 top-2 h-24 w-20 rotate-[8deg] rounded-md bg-gradient-to-br from-[#0c6b4d] via-[#06533d] to-[#012c22] shadow-[0_18px_30px_rgba(0,0,0,0.24)]">
              <div className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 bg-gradient-to-b from-[#f6d16a] via-[#d49b22] to-[#8f5f10]" />
              <div className="absolute left-0 top-8 h-4 w-full bg-gradient-to-r from-[#f6d16a] via-[#d49b22] to-[#8f5f10]" />
              <div className="absolute -top-4 left-5 h-6 w-8 rounded-full border-[5px] border-[#e6ae28]" />
              <div className="absolute -top-4 right-5 h-6 w-8 rounded-full border-[5px] border-[#e6ae28]" />
            </div>
            <div className="relative z-10 mt-5 flex justify-center text-[#e6ae28]">
              <Heart size={24} strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[300px] max-w-[86vw] flex-col bg-[#04241F] text-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="Barakah Decor" className="h-16 w-16 rounded-md object-contain" />
                <div>
                  <p className="text-xl font-extrabold leading-5 text-[#e6ae28]">BARAKAH</p>
                  <p className="text-xl font-extrabold leading-6 text-[#e6ae28]">DECOR</p>
                  <p className="mt-1 text-[10px] text-white/75">{"Embalagens e Decorações"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="scrollbar-hidden flex-1 space-y-5 overflow-y-auto px-5 pb-5">
              {navSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className={sectionIndex ? "border-t border-white/15 pt-5" : ""}>
                  <div className="space-y-2">
                    {section.map((item) => {
                      const Icon = item.icon;
                      const itemBadge = item.to === "/alertas" ? alertCount : item.badge;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `grid h-12 grid-cols-[48px_1fr_auto] items-center rounded-lg text-[15px] font-semibold transition ${
                              isActive ? "bg-gradient-to-r from-[#f0c04c] to-[#cf9c2d] text-white shadow-lg" : "text-white hover:bg-white/8"
                            }`
                          }
                        >
                          <span className="grid h-12 w-12 place-items-center">
                            <Icon size={20} />
                          </span>
                          <span className="whitespace-nowrap">{item.label}</span>
                          {Number(itemBadge) > 0 ? (
                            <span className="mr-4 grid h-6 min-w-6 place-items-center rounded-full bg-[#e2a827] px-2 text-xs text-white">
                              {itemBadge}
                            </span>
                          ) : null}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen px-4 py-5 lg:pl-[104px] lg:pr-5 xl:px-5 xl:pl-[104px] 2xl:pr-5">
        <header className="mb-5 grid items-start gap-4 xl:grid-cols-[1fr_430px_280px]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[#08271f] shadow-[0_8px_20px_rgba(0,0,0,0.06)] lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={23} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-normal text-[#08271f] xl:text-[22px]">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-black/55">{subtitle}</p> : null}
            </div>
          </div>

          <GlobalSearch />

          <div className="flex items-center justify-end gap-4">
            <button className="relative grid h-11 w-11 place-items-center rounded-full bg-transparent">
              <Bell size={23} />
              {alertCount > 0 ? (
                <span className="absolute -right-1 top-0 grid h-6 w-6 place-items-center rounded-full bg-[#d7a026] text-xs font-bold text-white">
                  {alertCount}
                </span>
              ) : null}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-black/5"
                aria-expanded={userMenuOpen}
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#004b35] text-xl font-bold text-white">{getUserInitial(currentUser.nome)}</div>
                <div className="text-left">
                  <p className="font-bold leading-5">{currentUser.nome}</p>
                  <p className="text-xs text-black/55">{currentUser.cargo}</p>
                </div>
                <ChevronDown size={18} className={`transition ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 top-[58px] z-30 w-48 rounded-xl border border-black/10 bg-white p-2 shadow-[0_18px_45px_rgba(20,38,31,0.16)]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={18} />
                    Sair
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mb-5 flex justify-end">
          <div className="flex h-11 items-center gap-3 rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <Calendar size={17} />
            {dataDeHoje()}
          </div>
        </div>

        {children}

        <footer className="py-6 text-center text-xs text-black/45">
          {"© 2026 Barakah Decor. Todos os direitos reservados."}
        </footer>
      </main>
    </div>
  );
}

