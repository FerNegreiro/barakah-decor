import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Heart,
  LogOut,
  Menu,
  Package,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import GlobalSearch from "../components/GlobalSearch";
import { encerrarSessao } from "../utils/auth";
import { API_URL } from "../utils/api";
import { getCurrentUser, getUserInitial } from "../utils/currentUser";
import { dataDeHoje, formatCurrency } from "../utils/format";
import { menuDoUsuario } from "../utils/navigation";

const thumbThemes = ["ruby", "gold", "paper", "ribbon", "kraft", "box"];

function formatVariation(value, label) {
  const numeric = Number(value || 0);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% ${label}`;
}

function ProductThumb({ theme = "box" }) {
  const styleByTheme = {
    ruby: "from-red-700 via-pink-700 to-amber-500",
    gold: "from-amber-100 via-yellow-500 to-amber-800",
    paper: "from-slate-100 via-emerald-100 to-rose-200",
    ribbon: "from-emerald-900 via-teal-700 to-emerald-500",
    kraft: "from-amber-200 via-stone-400 to-amber-700",
    box: "from-orange-200 via-amber-500 to-stone-600",
  };

  if (theme?.startsWith?.("/uploads/")) {
    return (
      <img
        src={`${API_URL}${theme}`}
        alt=""
        className="h-10 w-10 shrink-0 rounded-md border border-black/5 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gradient-to-br ${styleByTheme[theme] || styleByTheme.box} shadow-inner`}>
      <div className="absolute inset-x-3 top-0 h-full bg-white/35" />
      <div className="absolute inset-y-3 left-0 w-full bg-black/10" />
      <div className="absolute bottom-1 left-1 right-1 h-2 rounded-sm bg-white/20" />
    </div>
  );
}

function Card({ children, className = "", ...props }) {
  return (
    <section {...props} className={`rounded-[10px] border border-black/5 bg-white shadow-[0_8px_24px_rgba(20,38,31,0.08)] ${className}`}>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [filtroVendas, setFiltroVendas] = useState("7");
  const [filtroProdutos, setFiltroProdutos] = useState("este_mes");
  const [filtroFinanceiro, setFiltroFinanceiro] = useState("este_mes");
  const [movimentacoesAberta, setMovimentacoesAberta] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);
  const [dados, setDados] = useState({
    notificacoes_nao_lidas: 0,
    total_produtos: 0,
    total_itens: 0,
    estoque_baixo: 0,
    sem_estoque: 0,
    valor_estoque: 0,
    vendas_dia: 0,
    vendas_mes: 0,
    vendas_semana_total: 0,
    grafico_vendas: [],
    produtos_estoque_baixo: [],
    ultimas_movimentacoes: [],
    financeiro: {
      receitas: 0,
      despesas: 0,
      lucro_liquido: 0,
      grafico_barras: [],
    },
    produtos_mais_vendidos: [],
  });

  const navSections = menuDoUsuario(currentUser);

  async function handleLogout() {
    await encerrarSessao();
    setUserMenuOpen(false);
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const dashboardResponse = await axios.get("http://127.0.0.1:8000/dashboard", {
          params: {
            periodo_vendas: filtroVendas,
            filtro_produtos: filtroProdutos,
            filtro_financeiro: filtroFinanceiro,
          },
        });

        setDados((prev) => ({ ...prev, ...dashboardResponse.data }));
      } catch {
        setDados((prev) => prev);
      }
    }

    carregarDashboard();
  }, [filtroVendas, filtroProdutos, filtroFinanceiro]);

  const stockRows = useMemo(
    () =>
      (dados.produtos_estoque_baixo || []).slice(0, 5).map((produto, index) => ({
        ...produto,
        theme: produto.theme || thumbThemes[index % thumbThemes.length],
      })),
    [dados.produtos_estoque_baixo]
  );

  const valorEstoque = Number(dados.valor_estoque || 0);
  const vendasMes = Number(dados.vendas_mes || 0);

  const stats = [
    {
      label: "Total de Produtos",
      value: dados.total_produtos || 0,
      suffix: "ativos",
      foot: "Dados do sistema",
      footTo: "/produtos",
      icon: Package,
      color: "emerald",
    },
    {
      label: "Produtos Acabando",
      value: dados.estoque_baixo || 0,
      suffix: "itens",
      foot: "Ver lista",
      footTarget: "estoque-baixo",
      icon: AlertTriangle,
      color: "gold",
    },
    {
      label: "Sem Estoque",
      value: dados.sem_estoque || 0,
      suffix: "itens",
      foot: "Ver lista",
      footTarget: "estoque-baixo",
      icon: Package,
      color: "red",
    },
    {
      label: "Vendas do Dia",
      value: formatCurrency(dados.vendas_dia || 0),
      foot: formatVariation(dados.variacao_vendas_dia, "vs ontem"),
      footTone: Number(dados.variacao_vendas_dia || 0) < 0 ? "negative" : "positive",
      icon: ShoppingCart,
      color: "green",
    },
    {
      label: "Vendas do Mês",
      value: formatCurrency(vendasMes),
      foot: formatVariation(dados.variacao_vendas_mes, "vs mês passado"),
      footTone: Number(dados.variacao_vendas_mes || 0) < 0 ? "negative" : "positive",
      icon: BarChart,
      color: "forest",
    },
    {
      label: "Valor Total do Estoque",
      value: formatCurrency(valorEstoque),
      foot: "Atualizado agora",
      footTone: "muted",
      icon: CircleDollarSign,
      color: "bronze",
    },
  ];

  const colorClass = {
    emerald: "from-[#0f8b55] to-[#004b35]",
    gold: "from-[#e8ad09] to-[#c78900]",
    red: "from-[#ff2f2f] to-[#d30505]",
    green: "from-[#15985a] to-[#006d3f]",
    forest: "from-[#0d7d50] to-[#00442f]",
    bronze: "from-[#dca432] to-[#bf8122]",
  };

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
                  const itemBadge = item.to === "/alertas" ? Number(dados.notificacoes_nao_lidas || 0) : item.badge;
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
                      const itemBadge = item.to === "/alertas" ? Number(dados.notificacoes_nao_lidas || 0) : item.badge;
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
        <header className="mb-4 grid items-start gap-4 xl:grid-cols-[1fr_430px_280px]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-12 w-12 place-items-center rounded-lg bg-white text-[#08271f] shadow-[0_8px_20px_rgba(0,0,0,0.06)] lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={23} />
            </button>
            <h1 className="text-xl font-extrabold tracking-normal text-[#08271f] xl:text-[22px]">Bem-vindo, {currentUser.nome}! <span aria-hidden="true">{"👋"}</span></h1>
          </div>

          <GlobalSearch />

          <div className="flex items-center justify-end gap-4">
            <button className="relative grid h-11 w-11 place-items-center rounded-full bg-transparent">
              <Bell size={23} />
              {Number(dados.notificacoes_nao_lidas || 0) > 0 ? (
                <span className="absolute -right-1 top-0 grid h-6 w-6 place-items-center rounded-full bg-[#d7a026] text-xs font-bold text-white">
                  {dados.notificacoes_nao_lidas}
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

        <div className="mb-4 flex justify-end">
          <div className="flex h-11 items-center gap-3 rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <Calendar size={17} />
            {dataDeHoje()}
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const footClass = stat.footTone === "negative"
              ? "text-red-600"
              : stat.footTone === "muted"
                ? "text-[#00743d]"
                : stat.color === "red"
                  ? "text-red-600"
                  : stat.color === "gold"
                    ? "text-[#d69700]"
                    : "text-[#00743d]";
            return (
              <Card key={stat.label} className="min-h-[112px] p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br ${colorClass[stat.color]} text-white shadow-lg`}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold leading-4 text-black">{stat.label}</p>
                    <div className="mt-1 flex min-w-0 items-end gap-1.5">
                      <p className="min-w-0 whitespace-nowrap text-[20px] font-extrabold leading-6 text-[#071d18]">{stat.value}</p>
                      {stat.suffix ? <span className="pb-0.5 text-[11px] text-black/60">{stat.suffix}</span> : null}
                    </div>
                  </div>
                </div>
                <div className={`mt-3 text-center text-[11px] font-bold ${footClass}`}>
                  {stat.footTo ? (
                    <Link to={stat.footTo} className="inline-flex hover:underline">
                      {stat.foot}
                    </Link>
                  ) : stat.footTarget ? (
                    <button
                      type="button"
                      onClick={() => document.getElementById(stat.footTarget)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="font-bold hover:underline"
                    >
                      {stat.foot}
                    </button>
                  ) : (
                    <span>{stat.foot}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr] 2xl:grid-cols-[1.05fr_1fr_1fr]">
          <Card id="estoque-baixo" className="scroll-mt-6 p-4">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="text-[#e2a827]" size={22} />
              <h2 className="text-base font-extrabold">Produtos com Estoque Baixo</h2>
            </div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-black/8 text-xs text-black/65">
                  <tr>
                    <th className="pb-3 font-semibold">Produto</th>
                    <th className="pb-3 text-center font-semibold">Estoque Atual</th>
                    <th className="pb-3 text-center font-semibold">Estoque Mínimo</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((produto) => {
                    const status = produto.status || "Atenção";
                    const statusClass = status === "Sem estoque"
                      ? "bg-red-100 text-red-700"
                      : status === "Crítico"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-[#d69200]";

                    return (
                      <tr key={produto.id || produto.nome} className="border-b border-black/7 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb theme={produto.imagem_url || produto.theme} />
                            <span className="font-medium">{produto.nome}</span>
                          </div>
                        </td>
                        <td className={`py-3 text-center font-extrabold ${status === "Atenção" ? "text-[#d69200]" : "text-red-600"}`}>
                          {produto.quantidade}
                        </td>
                        <td className="py-3 text-center font-medium">{produto.minimo}</td>
                        <td className="py-3 text-right">
                          <span className={`rounded-md px-3 py-1 text-xs font-bold ${statusClass}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {stockRows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-black/50">
                        Nenhum produto com estoque baixo.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <Link to="/relatorios" className="mx-auto mt-4 flex w-fit items-center gap-2 text-sm font-bold text-[#006d3f]">
              Ver todos os produtos <ChevronRight size={16} />
            </Link>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <TrendingUp className="text-[#006d3f]" size={21} />
                  <h2 className="text-base font-extrabold">{`Vendas dos Últimos ${filtroVendas} Dias`}</h2>
                </div>
                <p className="text-[24px] font-extrabold">{formatCurrency(dados.vendas_semana_total || 0)}</p>
                <p className="text-sm text-black/65">Total de saídas registradas no período</p>
              </div>
              <select
                value={filtroVendas}
                onChange={(event) => setFiltroVendas(event.target.value)}
                className="h-10 rounded-lg border border-black/10 bg-white px-4 text-sm font-bold outline-none"
              >
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
              </select>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dados.grafico_vendas || []} margin={{ top: 15, right: 12, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0b7348" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#0b7348" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e7ece8" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#263b34" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#263b34" }} tickFormatter={(value) => (value >= 1000 ? `${value / 1000}K` : value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ border: "0", borderRadius: 8, boxShadow: "0 12px 30px rgba(0,0,0,.12)" }} />
                  <Area type="monotone" dataKey="valor" stroke="#006d3f" strokeWidth={3} fill="url(#salesFill)" activeDot={{ r: 6, fill: "#006d3f" }} dot={{ r: 4, fill: "#006d3f", stroke: "#006d3f" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PackageCheck className="text-[#006d3f]" size={22} />
                <h2 className="text-base font-extrabold">Produtos Mais Vendidos</h2>
              </div>
              <select
                value={filtroProdutos}
                onChange={(event) => setFiltroProdutos(event.target.value)}
                className="h-9 rounded-lg border border-black/10 bg-white px-4 text-xs font-bold outline-none"
              >
                <option value="este_mes">{"Este mês"}</option>
                <option value="mes_passado">{"Mês passado"}</option>
                <option value="tudo">{"Todo período"}</option>
              </select>
            </div>
            <div>
              {(dados.produtos_mais_vendidos || []).slice(0, 5).map((item, index) => (
                <div key={item.nome} className="grid grid-cols-[28px_46px_1fr_auto] items-center gap-3 border-b border-black/7 py-3 last:border-0">
                  <span className="text-center font-bold">{index + 1}</span>
                  <ProductThumb theme={item.imagem_url || item.theme || thumbThemes[index % thumbThemes.length]} />
                  <span className="font-medium">{item.nome}</span>
                  <span className="rounded-md bg-green-50 px-3 py-1 text-xs font-extrabold text-[#00743d]">{item.quantidade} un</span>
                </div>
              ))}
              {(!dados.produtos_mais_vendidos || dados.produtos_mais_vendidos.length === 0) ? (
                <p className="py-10 text-center text-sm text-black/50">Nenhuma venda registrada ainda.</p>
              ) : null}
            </div>
            <Link to="/relatorios" className="mx-auto mt-4 flex w-fit items-center gap-2 text-sm font-bold text-[#006d3f]">
              {"Ver relatório completo"} <ChevronRight size={16} />
            </Link>
          </Card>
        </section>

        <section className="mt-4 grid items-stretch gap-4 xl:grid-cols-[1.08fr_1fr]">
          <Card className="flex flex-col p-5 xl:h-[360px]">
            <h2 className="mb-4 text-base font-extrabold">{"Últimas Movimentações"}</h2>
            <div className="min-h-0 max-h-[420px] flex-1 overflow-auto">
              <table className="w-full min-w-[720px] text-sm">
                <tbody>
                  {(dados.ultimas_movimentacoes || []).slice(0, 5).map((mov) => (
                    <tr key={mov.id} className="border-b border-black/7 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-4">
                          <span className={`grid h-9 w-9 place-items-center rounded-full ${mov.tipo === "entrada" ? "bg-green-100 text-[#00743d]" : "bg-red-100 text-red-600"}`}>
                            {mov.tipo === "entrada" ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                          </span>
                          <span className="font-medium">{mov.titulo}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-medium">{mov.desc}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-3 py-1 text-xs font-bold ${mov.tipo === "entrada" ? "bg-green-50 text-[#00743d]" : "bg-red-50 text-red-600"}`}>
                          {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className="py-3 text-right text-black/65">{mov.data}</td>
                    </tr>
                  ))}
                  {(!dados.ultimas_movimentacoes || dados.ultimas_movimentacoes.length === 0) ? (
                    <tr>
                      <td colSpan="4" className="py-10 text-center text-black/50">
                        Nenhuma movimentação registrada ainda.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() => setMovimentacoesAberta(true)}
              className="mx-auto mt-auto flex items-center gap-2 pt-4 text-sm font-bold text-[#006d3f]"
            >
              {"Ver todas as movimentações"} <ChevronRight size={16} />
            </button>
          </Card>

          <Card className="flex flex-col p-5 xl:h-[360px]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-extrabold">Resumo Financeiro</h2>
              <select
                value={filtroFinanceiro}
                onChange={(event) => setFiltroFinanceiro(event.target.value)}
                className="h-9 rounded-lg border border-black/10 bg-white px-4 text-xs font-bold outline-none"
              >
                <option value="este_mes">{"Este mês"}</option>
                <option value="mes_passado">{"Mês passado"}</option>
                <option value="tudo">{"Todo período"}</option>
              </select>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-[#ecf6ef] p-5">
                <p className="text-xs font-bold text-[#006d3f]">Receitas</p>
                <p className="mt-2 text-xl font-extrabold text-[#00743d]">{formatCurrency(dados.financeiro?.receitas || 0)}</p>
              </div>
              <div className="rounded-lg bg-[#feeeeb] p-5">
                <p className="text-xs font-bold text-red-600">Despesas</p>
                <p className="mt-2 text-xl font-extrabold text-red-600">{formatCurrency(dados.financeiro?.despesas || 0)}</p>
              </div>
              <div className="rounded-lg bg-[#ecf6ef] p-5">
                <p className="text-xs font-bold text-[#006d3f]">{"Lucro Líquido"}</p>
                <p className="mt-2 text-xl font-extrabold text-[#00743d]">{formatCurrency(dados.financeiro?.lucro_liquido || 0)}</p>
              </div>
            </div>

            <div className="mb-3 flex justify-center gap-7 text-xs font-medium text-black/60">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#00743d]" />Receitas</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-red-600" />Despesas</span>
            </div>

            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={dados.financeiro?.grafico_barras || []} margin={{ top: 10, right: 5, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e7ece8" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#263b34" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#263b34" }} tickFormatter={(value) => (value >= 1000 ? `${value / 1000}K` : value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: "rgba(0,0,0,.035)" }} contentStyle={{ border: "0", borderRadius: 8, boxShadow: "0 12px 30px rgba(0,0,0,.12)" }} />
                  <Bar dataKey="receitas" fill="#00743d" radius={[5, 5, 0, 0]} barSize={14} />
                  <Bar dataKey="despesas" fill="#ef1f1f" radius={[5, 5, 0, 0]} barSize={14} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <Link to="/financeiro" className="mx-auto mt-3 flex w-fit items-center gap-2 text-sm font-bold text-[#006d3f]">
              {"Ver relatório financeiro completo"} <ChevronRight size={16} />
            </Link>
          </Card>
        </section>

        {movimentacoesAberta ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
            <div className="max-h-[82vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                <h2 className="text-lg font-extrabold">Todas as Movimentações</h2>
                <button
                  type="button"
                  onClick={() => setMovimentacoesAberta(false)}
                  className="grid h-9 w-9 place-items-center rounded-full text-[#08271f] hover:bg-black/5"
                  aria-label="Fechar movimentações"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="max-h-[65vh] overflow-auto px-6 py-3">
                <table className="w-full min-w-[760px] text-sm">
                  <tbody>
                    {(dados.ultimas_movimentacoes || []).map((mov) => (
                      <tr key={mov.id} className="border-b border-black/7 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-4">
                            <span className={`grid h-9 w-9 place-items-center rounded-full ${mov.tipo === "entrada" ? "bg-green-100 text-[#00743d]" : "bg-red-100 text-red-600"}`}>
                              {mov.tipo === "entrada" ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                            </span>
                            <span className="font-medium">{mov.titulo}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium">{mov.desc}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-md px-3 py-1 text-xs font-bold ${mov.tipo === "entrada" ? "bg-green-50 text-[#00743d]" : "bg-red-50 text-red-600"}`}>
                            {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td className="py-3 text-right text-black/65">{mov.data}</td>
                      </tr>
                    ))}
                    {(!dados.ultimas_movimentacoes || dados.ultimas_movimentacoes.length === 0) ? (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-black/50">
                          Nenhuma movimentação registrada ainda.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        <footer className="py-6 text-center text-xs text-black/45">
          {"© 2026 Barakah Decor. Todos os direitos reservados."}
        </footer>
      </main>
    </div>
  );
}



