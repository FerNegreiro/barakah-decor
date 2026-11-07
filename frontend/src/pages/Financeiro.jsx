import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BarChart3, Plus, Receipt, Target, Trash2, TrendingUp, Wallet } from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppLayout, DangerButton, Field, PageCard, PrimaryButton, SelectField } from "../components/AppLayout";
import { formatCurrency } from "../utils/format";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

export default function Financeiro() {
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [lancamentos, setLancamentos] = useState([]);

  async function carregarLancamentos() {
    try {
      const response = await axios.get("http://127.0.0.1:8000/financeiro");
      setLancamentos(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function salvarLancamento() {
    if (!tipo || !descricao || !valor) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/financeiro", {
        tipo,
        descricao,
        valor: parseFloat(valor),
      });

      setTipo("");
      setDescricao("");
      setValor("");
      carregarLancamentos();
      alert("Lançamento salvo com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar lançamento");
    }
  }

  async function excluirLancamento(id) {
    try {
      await axios.delete(`http://127.0.0.1:8000/financeiro/${id}`);
      carregarLancamentos();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir lançamento");
    }
  }

  useEffect(() => {
    carregarLancamentos();
  }, []);

  const financeiro = useMemo(() => {
    const receitas = lancamentos
      .filter((item) => item.tipo === "Receita")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const despesas = lancamentos
      .filter((item) => item.tipo === "Despesa")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const lucro = receitas - despesas;
    const margem = receitas ? (lucro / receitas) * 100 : 0;
    const ticketMedio = lancamentos.length ? (receitas + despesas) / lancamentos.length : 0;
    const maiorReceita = Math.max(0, ...lancamentos.filter((item) => item.tipo === "Receita").map((item) => Number(item.valor || 0)));
    const maiorDespesa = Math.max(0, ...lancamentos.filter((item) => item.tipo === "Despesa").map((item) => Number(item.valor || 0)));

    const porDia = {};
    lancamentos.forEach((item) => {
      const label = formatDate(item.data);
      if (!porDia[label]) {
        porDia[label] = { dia: label, receitas: 0, despesas: 0 };
      }
      if (item.tipo === "Receita") {
        porDia[label].receitas += Number(item.valor || 0);
      } else {
        porDia[label].despesas += Number(item.valor || 0);
      }
    });

    const grafico = Object.values(porDia).slice(-10);

    return {
      receitas,
      despesas,
      lucro,
      margem,
      ticketMedio,
      maiorReceita,
      maiorDespesa,
      grafico,
    };
  }, [lancamentos]);

  const cards = [
    {
      label: "Receitas",
      value: formatCurrency(financeiro.receitas),
      detail: `${lancamentos.filter((item) => item.tipo === "Receita").length} lançamentos`,
      icon: Wallet,
      bg: "bg-[#ecf6ef]",
      color: "text-[#00743d]",
    },
    {
      label: "Despesas",
      value: formatCurrency(financeiro.despesas),
      detail: `${lancamentos.filter((item) => item.tipo === "Despesa").length} lançamentos`,
      icon: Receipt,
      bg: "bg-[#feeeeb]",
      color: "text-red-600",
    },
    {
      label: "Lucro Líquido",
      value: formatCurrency(financeiro.lucro),
      detail: `${financeiro.margem.toFixed(1)}% de margem`,
      icon: TrendingUp,
      bg: "bg-[#ecf6ef]",
      color: financeiro.lucro >= 0 ? "text-[#00743d]" : "text-red-600",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(financeiro.ticketMedio),
      detail: "Média por lançamento",
      icon: Target,
      bg: "bg-white",
      color: "text-[#00743d]",
    },
  ];

  return (
    <AppLayout title="Financeiro" subtitle="Controle receitas, despesas e resultado com visão gerencial.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Novo Lançamento</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="">Tipo</option>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </SelectField>
            <Field
              placeholder="Descrição"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
            <Field
              type="number"
              step="0.01"
              placeholder="Valor"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
            />
          </div>
          <PrimaryButton onClick={salvarLancamento} className="mt-5">
            <Plus size={18} />
            Salvar Lançamento
          </PrimaryButton>
        </PageCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <PageCard key={card.label} className={`p-6 ${card.bg}`}>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold text-black/55">{card.label}</p>
                  <Icon className={card.color} size={22} />
                </div>
                <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
                <p className="mt-2 text-xs font-bold text-black/45">{card.detail}</p>
              </PageCard>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <PageCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <BarChart3 className="text-[#00743d]" size={22} />
              <h2 className="text-lg font-extrabold">Fluxo Financeiro por Dia</h2>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={financeiro.grafico} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e7ece8" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#263b34" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#263b34" }} tickFormatter={(value) => (value >= 1000 ? `${value / 1000}K` : value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: "rgba(0,0,0,.035)" }} contentStyle={{ border: "0", borderRadius: 8, boxShadow: "0 12px 30px rgba(0,0,0,.12)" }} />
                  <Bar dataKey="receitas" fill="#00743d" radius={[5, 5, 0, 0]} barSize={18} />
                  <Bar dataKey="despesas" fill="#ef1f1f" radius={[5, 5, 0, 0]} barSize={18} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          <PageCard className="p-6">
            <h2 className="mb-5 text-lg font-extrabold">Resumo Gerencial</h2>
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-[#ecf6ef] p-4">
                <p className="text-xs font-bold text-black/50">Maior Receita</p>
                <p className="mt-1 text-2xl font-extrabold text-[#00743d]">{formatCurrency(financeiro.maiorReceita)}</p>
              </div>
              <div className="rounded-lg bg-[#feeeeb] p-4">
                <p className="text-xs font-bold text-black/50">Maior Despesa</p>
                <p className="mt-1 text-2xl font-extrabold text-red-600">{formatCurrency(financeiro.maiorDespesa)}</p>
              </div>
              <div className="rounded-lg border border-black/10 p-4">
                <p className="text-xs font-bold text-black/50">Resultado</p>
                <p className="mt-1 font-semibold text-black/70">
                  {financeiro.lucro >= 0
                    ? "O período está com saldo positivo."
                    : "O período está com saldo negativo."}
                </p>
              </div>
            </div>
          </PageCard>
        </section>

        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Lançamentos</h2>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3 font-bold">Data</th>
                  <th className="pb-3 font-bold">Tipo</th>
                  <th className="pb-3 font-bold">Descrição</th>
                  <th className="pb-3 font-bold">Valor</th>
                  <th className="pb-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((item) => (
                  <tr key={item.id} className="border-b border-black/7 last:border-0">
                    <td className="py-4 text-black/60">{formatDate(item.data)}</td>
                    <td className="py-4">
                      <span className={`rounded-md px-3 py-1 text-xs font-bold ${item.tipo === "Receita" ? "bg-green-50 text-[#00743d]" : "bg-red-50 text-red-600"}`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className="py-4 font-semibold">{item.descricao}</td>
                    <td className={`py-4 font-bold ${item.tipo === "Receita" ? "text-[#00743d]" : "text-red-600"}`}>
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="py-4 text-right">
                      <DangerButton onClick={() => excluirLancamento(item.id)}>
                        <Trash2 size={16} />
                        Excluir
                      </DangerButton>
                    </td>
                  </tr>
                ))}
                {lancamentos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-black/50">
                      Nenhum lançamento financeiro registrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </PageCard>
      </div>
    </AppLayout>
  );
}

