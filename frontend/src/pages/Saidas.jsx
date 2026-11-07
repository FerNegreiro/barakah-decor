import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowUpFromLine } from "lucide-react";

import { AppLayout, Field, PageCard, PrimaryButton, SelectField } from "../components/AppLayout";
import { mensagemDeErro } from "../utils/download";
import { ordenarProdutosPorNome } from "../utils/format";

export default function Saidas() {
  const [produtos, setProdutos] = useState([]);
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  async function carregarProdutos() {
    try {
      const response = await axios.get("http://127.0.0.1:8000/produtos");
      setProdutos(ordenarProdutosPorNome(response.data || []));
    } catch (error) {
      console.error(error);
    }
  }

  async function registrarSaida() {
    if (!produtoId || !quantidade) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/saidas", {
        produto_id: parseInt(produtoId, 10),
        quantidade: parseInt(quantidade, 10),
      });

      alert(`Saída registrada com sucesso! Estoque atual: ${response.data.novo_estoque}`);
      setProdutoId("");
      setQuantidade("");
      carregarProdutos();
    } catch (error) {
      console.error(error);
      alert(mensagemDeErro(error, "Erro ao registrar saída"));
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <AppLayout title="Saídas / Vendas" subtitle="Registre vendas e baixas do estoque.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Nova Saída de Estoque</h2>
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <SelectField value={produtoId} onChange={(event) => setProdutoId(event.target.value)}>
              <option value="">Selecione um produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </SelectField>
            <Field
              type="number"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
            />
            <PrimaryButton onClick={registrarSaida} className="bg-red-600 hover:bg-red-700">
              <ArrowUpFromLine size={18} />
              Registrar Saída
            </PrimaryButton>
          </div>
        </PageCard>

        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Estoque Atual</h2>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3 font-bold">Produto</th>
                  <th className="pb-3 font-bold">Categoria</th>
                  <th className="pb-3 text-right font-bold">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-b border-black/7 last:border-0">
                    <td className="py-4 font-semibold">{produto.nome}</td>
                    <td className="py-4">{produto.categoria}</td>
                    <td className="py-4 text-right font-bold">{produto.quantidade}</td>
                  </tr>
                ))}
                {produtos.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-black/50">
                      Nenhum produto cadastrado no estoque.
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


