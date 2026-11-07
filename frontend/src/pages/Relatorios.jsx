import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Package,
  ShoppingBag,
  Trophy,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { AppLayout, PageCard, PrimaryButton } from "../components/AppLayout";
import ProductImage from "../components/ProductImage";
import { baixarArquivo } from "../utils/download";
import { formatCurrency } from "../utils/format";

export default function Relatorios() {
  const [dados, setDados] = useState({
    total_produtos: 0,
    total_itens: 0,
    valor_total: 0,
    estoque_baixo: 0,
    total_vendido: 0,
    faturamento_vendas: 0,
    produtos_mais_vendidos: [],
    estoque_por_categoria: [],
    produtos_estoque_baixo: [],
  });

  async function carregarRelatorios() {
    try {
      const relatorio = await axios.get("http://127.0.0.1:8000/relatorios");
      setDados(relatorio.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function exportarExcel() {
    try {
      await baixarArquivo("http://127.0.0.1:8000/relatorios/excel", "relatorio_gerencial_barakah_decor.xlsx");
    } catch (error) {
      console.error(error);
      alert("Não foi possível gerar o Excel agora.");
    }
  }

  async function exportarPdf() {
    try {
      await baixarArquivo("http://127.0.0.1:8000/relatorios/pdf", "relatorio_gerencial_barakah_decor.pdf");
    } catch (error) {
      console.error(error);
      alert("Não foi possível gerar o PDF agora.");
    }
  }

  useEffect(() => {
    carregarRelatorios();
  }, []);


  const produtosEmAtencao = dados.produtos_estoque_baixo || [];
  const cards = [
    {
      label: "Produtos Cadastrados",
      value: dados.total_produtos,
      icon: Package,
      color: "text-[#00743d]",
      bg: "bg-[#ecf6ef]",
    },
    {
      label: "Itens em Estoque",
      value: dados.total_itens,
      icon: Boxes,
      color: "text-[#00743d]",
      bg: "bg-[#ecf6ef]",
    },
    {
      label: "Valor Total do Estoque",
      value: formatCurrency(dados.valor_total),
      icon: Wallet,
      color: "text-[#00743d]",
      bg: "bg-[#ecf6ef]",
    },
    {
      label: "Unidades Vendidas",
      value: dados.total_vendido,
      icon: ShoppingBag,
      color: "text-[#00743d]",
      bg: "bg-[#ecf6ef]",
    },
    {
      label: "Faturamento em Vendas",
      value: formatCurrency(dados.faturamento_vendas),
      icon: Trophy,
      color: "text-[#00743d]",
      bg: "bg-[#ecf6ef]",
    },
    {
      label: "Estoque Baixo",
      value: produtosEmAtencao.length,
      icon: TriangleAlert,
      color: "text-red-600",
      bg: "bg-[#feeeeb]",
    },
  ];

  return (
    <AppLayout title="Relatórios" subtitle="Acompanhe vendas, estoque e indicadores do negócio.">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={exportarExcel} className="bg-[#00743d]">
            <FileSpreadsheet size={18} />
            Exportar Excel
          </PrimaryButton>
          <PrimaryButton onClick={exportarPdf} className="bg-red-600 hover:bg-red-700">
            <FileText size={18} />
            Exportar PDF
          </PrimaryButton>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <PageCard key={card.label} className={`p-4 ${card.bg}`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-black/60">{card.label}</p>
                  <Icon className={card.color} size={22} />
                </div>
                <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
              </PageCard>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
          <PageCard className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <Trophy className="text-[#00743d]" size={22} />
              <h2 className="text-lg font-extrabold">Produtos Mais Vendidos</h2>
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-black/10 bg-white text-xs text-black/60">
                  <tr>
                    <th className="pb-3">Posição</th>
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Categoria</th>
                    <th className="pb-3">Unidades</th>
                    <th className="pb-3">Faturamento</th>
                    <th className="pb-3">Ticket Médio</th>
                    <th className="pb-3">Participação</th>
                    <th className="pb-3">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {(dados.produtos_mais_vendidos || []).map((produto, index) => (
                    <tr key={`${produto.nome}-${index}`} className="border-b border-black/7 last:border-0">
                      <td className="py-3 font-extrabold text-[#00743d]">{index + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage src={produto.imagem_url} name={produto.nome} size="sm" />
                          <span className="font-semibold">{produto.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 text-black/65">{produto.categoria}</td>
                      <td className="py-3 font-bold">{produto.quantidade} un</td>
                      <td className="py-3 font-bold text-[#00743d]">{formatCurrency(produto.faturamento)}</td>
                      <td className="py-3">{formatCurrency(produto.ticket_medio)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-black/10">
                            <div className="h-full rounded-full bg-[#00743d]" style={{ width: `${Math.min(produto.participacao || 0, 100)}%` }} />
                          </div>
                          <span className="font-bold">{produto.participacao || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3">{produto.estoque_atual} un</td>
                    </tr>
                  ))}
                  {(!dados.produtos_mais_vendidos || dados.produtos_mais_vendidos.length === 0) ? (
                    <tr>
                      <td colSpan="8" className="py-10 text-center text-black/50">
                        Nenhuma venda registrada ainda.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </PageCard>

          <PageCard className="p-5">
            <h2 className="mb-4 text-lg font-extrabold">Estoque por Categoria</h2>
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {(dados.estoque_por_categoria || []).map((categoria) => {
                const percent = dados.valor_total ? (categoria.valor / dados.valor_total) * 100 : 0;
                return (
                  <div key={categoria.categoria}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{categoria.categoria}</p>
                        <p className="text-xs text-black/50">{categoria.produtos} produtos • {categoria.quantidade} unidades</p>
                      </div>
                      <span className="font-extrabold text-[#00743d]">{formatCurrency(categoria.valor)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full bg-[#00743d]" style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </PageCard>
        </section>

        <PageCard className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TriangleAlert className="text-red-600" size={22} />
              <div>
                <h2 className="text-lg font-extrabold">Produtos em Atenção</h2>
                <p className="text-sm text-black/55">Priorize reposição antes de perder venda.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/entradas" className="flex h-10 items-center gap-2 rounded-lg bg-[#00743d] px-4 text-sm font-bold text-white">
                <ArrowDownToLine size={17} />
                Registrar entrada
              </Link>
              <Link to="/produtos" className="flex h-10 items-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-bold text-[#08271f]">
                <ClipboardList size={17} />
                Ver produtos
              </Link>
            </div>
          </div>

          {produtosEmAtencao.length > 0 ? (
            <div className="grid max-h-[60vh] gap-3 overflow-y-auto pr-2 xl:grid-cols-2">
              {produtosEmAtencao.map((produto) => {
                const minimo = produto.minimo || 30;
                const percentual = Math.min(Number(produto.nivel_percentual ?? ((produto.quantidade / minimo) * 100)) || 0, 100);
                const critical = produto.critical;
                return (
                  <div key={produto.id || produto.nome} className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-extrabold">{produto.nome}</p>
                        <p className="text-sm text-black/55">{produto.categoria || "Sem categoria"}</p>
                      </div>
                      <span className={`rounded-md px-3 py-1 text-xs font-bold ${critical ? "bg-red-50 text-red-600" : "bg-amber-50 text-[#d69200]"}`}>
                        {produto.status || "Atenção"}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold">{produto.quantidade} un</span>
                      <span className="text-black/55">mínimo {minimo} un</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-black/10">
                      <div className={`h-full rounded-full ${critical ? "bg-red-600" : "bg-[#e2a827]"}`} style={{ width: `${percentual}%` }} />
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg bg-[#f7f8f7] p-3">
                        <p className="text-xs font-bold text-black/45">Reposição</p>
                        <p className="mt-1 font-extrabold text-[#00743d]">{produto.reposicao_sugerida ?? Math.max(minimo - produto.quantidade, 0)} un</p>
                      </div>
                      <div className="rounded-lg bg-[#f7f8f7] p-3">
                        <p className="text-xs font-bold text-black/45">Preço</p>
                        <p className="mt-1 font-extrabold">{formatCurrency(produto.preco)}</p>
                      </div>
                      <div className="rounded-lg bg-[#f7f8f7] p-3">
                        <p className="text-xs font-bold text-black/45">Valor</p>
                        <p className="mt-1 font-extrabold">{formatCurrency(produto.valor_total)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-[#bfe5cc] bg-[#f1fbf4] p-6 text-center">
              <CheckCircle2 className="mx-auto text-[#00743d]" size={42} />
              <p className="mt-3 text-xl font-extrabold text-[#006d3f]">Nenhum produto em atenção</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/55">
                O estoque está acima do mínimo configurado. Continue acompanhando entradas, saídas e produtos mais vendidos para antecipar reposições.
              </p>
            </div>
          )}
        </PageCard>
      </div>
    </AppLayout>
  );
}
