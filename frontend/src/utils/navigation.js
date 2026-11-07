import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart,
  Bell,
  CircleDollarSign,
  Home,
  Layers,
  Package,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
} from "lucide-react";

const secoesDoMenu = [
  [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/produtos", label: "Produtos", icon: Package },
    { to: "/categorias", label: "Categorias", icon: Layers },
    { to: "/entradas", label: "Entradas", icon: ArrowDownToLine },
    { to: "/saidas", label: "Saídas / Vendas", icon: ArrowUpFromLine },
    { to: "/compras", label: "Compras", icon: ShoppingCart },
    { to: "/fornecedores", label: "Fornecedores", icon: Users },
  ],
  [
    { to: "/relatorios", label: "Relatórios", icon: BarChart },
    { to: "/financeiro", label: "Financeiro", icon: CircleDollarSign },
    { to: "/alertas", label: "Alertas", icon: Bell },
  ],
  [
    { to: "/configuracoes", label: "Configurações", icon: Settings },
    { to: "/usuarios", label: "Usuários", icon: UserCog, somenteAdmin: true },
  ],
];

export function menuDoUsuario(usuario) {
  const ehAdmin = usuario?.cargo === "Administrador";
  return secoesDoMenu
    .map((secao) => secao.filter((item) => !item.somenteAdmin || ehAdmin))
    .filter((secao) => secao.length > 0);
}
