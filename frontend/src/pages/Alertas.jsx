import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowDownToLine, Bell, CheckCircle2, ClipboardList, PackageX, TriangleAlert } from "lucide-react";

import { AppLayout, PageCard } from "../components/AppLayout";

function alertStyle(status) {
  if (status === "Sem estoque") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === "Crítico") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function Alertas() {
  const [dados, setDados] = useState({
    produtos_estoque_baixo: [],
    sem_estoque: 0,
    estoque_baixo: 0,
  });

  useEffect(() => {
    async function carregarAlertas() {
      try {
        const response = await axios.get("http://127.0.0.1:8000/alertas");
        setDados({
          produtos_estoque_baixo: response.data?.produtos || [],
          sem_estoque: response.data?.sem_estoque || 0,
          estoque_baixo: response.data?.total || 0,
        });
      } catch (error) {
        console.error(error);
      }
    }

    carregarAlertas();
  }, []);

  const alertas = useMemo(() => {
    return (dados.produtos_estoque_baixo || []).map((produto) => ({
      id: produto.id || produto.nome,
      titulo: produto.status || "Atenção",
      produto: produto.nome,
      descricao: `${produto.quantidade} unidades em estoque. Mínimo recomendado: ${produto.minimo}.`,
      reposicao: produto.reposicao_sugerida || 0,
      status: produto.status,
      icon: produto.status === "Sem estoque" ? PackageX : TriangleAlert,
    }));
  }, [dados.produtos_estoque_baixo]);

  return (
    <AppLayout title="Alertas" subtitle="Acompanhe avisos importantes sobre estoque e operação.">
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-3">
          <PageCard className="bg-red-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-black/60">Sem Estoque</p>
              <PackageX className="text-red-600" size={24} />
            </div>
            <p className="text-3xl font-extrabold text-red-600">{dados.sem_estoque || 0}</p>
          </PageCard>
          <PageCard className="bg-amber-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-black/60">Produtos em Atenção</p>
              <TriangleAlert className="text-[#d69200]" size={24} />
            </div>
            <p className="text-3xl font-extrabold text-[#d69200]">{dados.estoque_baixo || 0}</p>
          </PageCard>
          <PageCard className="bg-[#ecf6ef] p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-black/60">Status Geral</p>
              <Bell className="text-[#00743d]" size={24} />
            </div>
            <p className="text-3xl font-extrabold text-[#00743d]">
              {alertas.length ? "Acompanhar" : "Saudável"}
            </p>
          </PageCard>
        </section>

        <PageCard className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold">Central de Alertas</h2>
              <p className="mt-1 text-sm text-black/55">Priorize os itens com maior risco de faltar.</p>
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

          <div className="grid gap-4">
            {alertas.map((alerta) => {
              const Icon = alerta.icon;
              return (
                <div key={alerta.id} className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 ${alertStyle(alerta.status)}`}>
                  <div className="flex items-start gap-4">
                    <Icon className="mt-0.5 shrink-0" size={24} />
                    <div>
                      <p className="font-extrabold">{alerta.produto}</p>
                      <p className="mt-1 text-sm">{alerta.descricao}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-md bg-white/70 px-3 py-1 text-xs font-extrabold">{alerta.titulo}</span>
                    <p className="mt-2 text-sm font-bold">Repor {alerta.reposicao} un</p>
                  </div>
                </div>
              );
            })}

            {alertas.length === 0 ? (
              <div className="rounded-lg border border-[#bfe5cc] bg-[#f1fbf4] p-8 text-center">
                <CheckCircle2 className="mx-auto text-[#00743d]" size={44} />
                <p className="mt-3 text-xl font-extrabold text-[#006d3f]">Nenhum alerta ativo</p>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/55">
                  Todos os produtos estão acima do ponto de atenção. Continue registrando entradas e saídas para manter os avisos atualizados.
                </p>
              </div>
            ) : null}
          </div>
        </PageCard>
      </div>
    </AppLayout>
  );
}
