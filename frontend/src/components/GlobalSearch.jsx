import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Layers, Package, Search } from "lucide-react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [produtosResponse, categoriasResponse] = await Promise.all([
          axios.get("http://127.0.0.1:8000/produtos"),
          axios.get("http://127.0.0.1:8000/categorias"),
        ]);
        setProdutos(produtosResponse.data || []);
        setCategorias(categoriasResponse.data || []);
      } catch (error) {
        console.error(error);
      }
    }

    carregarDados();
  }, []);

  const resultados = useMemo(() => {
    const termo = normalize(query);
    if (!termo) {
      return [];
    }

    const produtosEncontrados = produtos
      .filter((produto) => normalize(`${produto.nome} ${produto.categoria}`).includes(termo))
      .slice(0, 5)
      .map((produto) => ({
        id: `produto-${produto.id}`,
        tipo: "Produto",
        titulo: produto.nome,
        detalhe: `${produto.categoria || "Sem categoria"} • ${produto.quantidade || 0} un`,
        to: "/produtos",
        icon: Package,
      }));

    const categoriasEncontradas = categorias
      .filter((categoria) => normalize(categoria.nome).includes(termo))
      .slice(0, 4)
      .map((categoria) => ({
        id: `categoria-${categoria.id}`,
        tipo: "Categoria",
        titulo: categoria.nome,
        detalhe: "Ver categoria cadastrada",
        to: "/categorias",
        icon: Layers,
      }));

    return [...produtosEncontrados, ...categoriasEncontradas].slice(0, 7);
  }, [categorias, produtos, query]);

  const showResults = focused && query.trim().length > 0;

  return (
    <div className="relative h-12">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 140)}
        placeholder="Buscar produtos, categorias..."
        className="h-full w-full rounded-lg border border-black/10 bg-white px-5 pr-12 text-sm shadow-[0_8px_22px_rgba(0,0,0,0.06)] outline-none focus:border-[#006d3f]"
      />
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#08271f]" size={21} />

      {showResults ? (
        <div className="absolute left-0 right-0 top-[56px] z-50 overflow-hidden rounded-lg border border-black/10 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
          {resultados.length ? (
            resultados.map((resultado) => {
              const Icon = resultado.icon;
              return (
                <Link
                  key={resultado.id}
                  to={resultado.to}
                  onClick={() => setQuery("")}
                  className="flex items-center gap-3 border-b border-black/7 px-4 py-3 last:border-0 hover:bg-[#f7f8f7]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ecf6ef] text-[#00743d]">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{resultado.titulo}</span>
                    <span className="block truncate text-xs text-black/55">{resultado.tipo} • {resultado.detalhe}</span>
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-5 text-center text-sm text-black/50">
              Nenhum produto ou categoria encontrado.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
