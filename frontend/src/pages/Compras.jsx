import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ShoppingCart } from "lucide-react";

import { AppLayout, Field, PageCard, PrimaryButton, SelectField } from "../components/AppLayout";
import { mensagemDeErro } from "../utils/download";

export default function Compras() {
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [produtoId, setProdutoId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valor, setValor] = useState("");

  async function carregarDados() {
    try {
      const [produtosResponse, fornecedoresResponse, comprasResponse] = await Promise.all([
        axios.get("http://127.0.0.1:8000/produtos"),
        axios.get("http://127.0.0.1:8000/fornecedores"),
        axios.get("http://127.0.0.1:8000/compras"),
      ]);

      setProdutos(produtosResponse.data);
      setFornecedores(fornecedoresResponse.data);
      setCompras(comprasResponse.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function registrarCompra() {
    if (!produtoId || !fornecedorId || !quantidade || !valor) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/compras", {
        produto_id: parseInt(produtoId, 10),
        fornecedor_id: parseInt(fornecedorId, 10),
        quantidade: parseInt(quantidade, 10),
        valor: parseFloat(valor),
      });

      alert("Compra registrada com sucesso!");
      setProdutoId("");
      setFornecedorId("");
      setQuantidade("");
      setValor("");
      carregarDados();
    } catch (error) {
      console.error(error);
      alert(mensagemDeErro(error, "Erro ao registrar compra"));
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const produtosPorId = useMemo(
    () => Object.fromEntries(produtos.map((produto) => [produto.id, produto.nome])),
    [produtos]
  );

  const fornecedoresPorId = useMemo(
    () => Object.fromEntries(fornecedores.map((fornecedor) => [fornecedor.id, fornecedor.nome])),
    [fornecedores]
  );

  return (
    <AppLayout title="Compras" subtitle="Registre compras de fornecedores e acompanhe o histórico.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Registrar Compra</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SelectField value={produtoId} onChange={(event) => setProdutoId(event.target.value)}>
              <option value="">Selecione o produto</option>
              {produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </SelectField>

            <SelectField value={fornecedorId} onChange={(event) => setFornecedorId(event.target.value)}>
              <option value="">Selecione o fornecedor</option>
              {fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </SelectField>

            <Field
              type="number"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
            />
            <Field
              type="number"
              step="0.01"
              placeholder="Valor da compra"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
            />
          </div>

          <PrimaryButton onClick={registrarCompra} className="mt-5">
            <ShoppingCart size={18} />
            Registrar Compra
          </PrimaryButton>
        </PageCard>

        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Histórico de Compras</h2>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3 font-bold">Produto</th>
                  <th className="pb-3 font-bold">Fornecedor</th>
                  <th className="pb-3 font-bold">Quantidade</th>
                  <th className="pb-3 text-right font-bold">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id} className="border-b border-black/7 last:border-0">
                    <td className="py-4 font-semibold">{produtosPorId[compra.produto_id] || `Produto #${compra.produto_id}`}</td>
                    <td className="py-4">{fornecedoresPorId[compra.fornecedor_id] || `Fornecedor #${compra.fornecedor_id}`}</td>
                    <td className="py-4">{compra.quantidade}</td>
                    <td className="py-4 text-right font-bold text-[#00743d]">
                      {Number(compra.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                  </tr>
                ))}
                {compras.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-black/50">
                      Nenhuma compra registrada.
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

