import { useEffect, useState } from "react";
import axios from "axios";
import { Edit, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";

import { AppLayout, DangerButton, Field, PageCard, PrimaryButton } from "../components/AppLayout";
import { mensagemDeErro } from "../utils/download";
import { ordenarProdutosPorNome } from "../utils/format";
import ProductImage from "../components/ProductImage";
import { API_URL } from "../utils/api";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CampoProduto({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-extrabold uppercase tracking-wide text-black/45">{label}</span>
      {children}
    </label>
  );
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [idEdicao, setIdEdicao] = useState(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [preco, setPreco] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [estoqueMinimoPadrao, setEstoqueMinimoPadrao] = useState(30);
  const [imagemAtual, setImagemAtual] = useState("");
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [imagemPreview, setImagemPreview] = useState("");
  const [busca, setBusca] = useState("");

  async function carregarProdutos() {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutos(ordenarProdutosPorNome(response.data || []));
    } catch (error) {
      console.error(error);
    }
  }

  function limparFormulario() {
    setIdEdicao(null);
    setNome("");
    setCategoria("");
    setQuantidade("");
    setPreco("");
    setEstoqueMinimo("");
    setImagemAtual("");
    setImagemArquivo(null);
    setImagemPreview("");
  }

  function escolherImagem(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Escolha uma imagem com at\u00e9 4 MB.");
      return;
    }

    setImagemArquivo(file);
    setImagemPreview(URL.createObjectURL(file));
  }

  async function enviarImagem(produtoId) {
    if (!imagemArquivo) return;

    const conteudo = await fileToBase64(imagemArquivo);
    await axios.post(`${API_URL}/produtos/${produtoId}/imagem`, {
      nome_arquivo: imagemArquivo.name,
      conteudo,
    });
  }

  async function removerImagem() {
    if (!idEdicao) {
      setImagemArquivo(null);
      setImagemPreview("");
      return;
    }

    try {
      await axios.delete(`${API_URL}/produtos/${idEdicao}/imagem`);
      setImagemAtual("");
      setImagemArquivo(null);
      setImagemPreview("");
      carregarProdutos();
    } catch (error) {
      console.error(error);
      alert("Erro ao remover imagem");
    }
  }

  async function salvarProduto() {
    if (!nome.trim() || !categoria.trim() || !quantidade || !preco) {
      alert("Preencha todos os campos");
      return;
    }

    const payload = {
      nome: nome.trim(),
      categoria: categoria.trim(),
      quantidade: parseInt(quantidade, 10),
      preco: parseFloat(preco),
      estoque_minimo: estoqueMinimo ? parseInt(estoqueMinimo, 10) : null,
    };

    try {
      if (idEdicao) {
        await axios.put(`${API_URL}/produtos/${idEdicao}`, payload);
        await enviarImagem(idEdicao);
        alert("Produto atualizado com sucesso!");
      } else {
        const response = await axios.post(`${API_URL}/produtos`, payload);
        await enviarImagem(response.data.id);
        alert("Produto cadastrado com sucesso!");
      }

      limparFormulario();
      carregarProdutos();
    } catch (error) {
      console.error(error);
      alert(mensagemDeErro(error, "Erro ao salvar produto"));
    }
  }

  async function excluirProduto(id) {
    try {
      await axios.delete(`${API_URL}/produtos/${id}`);
      carregarProdutos();
    } catch (error) {
      console.error(error);
      alert(mensagemDeErro(error, "Erro ao excluir produto"));
    }
  }

  function editarProduto(produto) {
    setIdEdicao(produto.id);
    setNome(produto.nome);
    setCategoria(produto.categoria);
    setQuantidade(produto.quantidade);
    setPreco(produto.preco);
    setEstoqueMinimo(String(produto.estoque_minimo || ""));
    setImagemAtual(produto.imagem_url || "");
    setImagemArquivo(null);
    setImagemPreview("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    carregarProdutos();
    axios
      .get(`${API_URL}/configuracoes`)
      .then((response) => setEstoqueMinimoPadrao(response.data?.estoque_minimo_padrao || 30))
      .catch(() => null);
  }, []);

  const produtosFiltrados = ordenarProdutosPorNome(
    produtos.filter((produto) => produto.nome.toLowerCase().includes(busca.toLowerCase()))
  );

  const precoTotalFormulario = Number(quantidade || 0) * Number(preco || 0);

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <AppLayout title="Produtos" subtitle="Cadastre, edite e acompanhe os itens do estoque.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{idEdicao ? "Editar Produto" : "Novo Produto"}</h2>
            {idEdicao ? (
              <button onClick={limparFormulario} className="text-sm font-bold text-black/55 hover:text-[#006d3f]">
                {"Cancelar edi\u00e7\u00e3o"}
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CampoProduto label="Nome do produto">
              <Field className="w-full" placeholder="Nome do produto" value={nome} onChange={(event) => setNome(event.target.value)} />
            </CampoProduto>
            <CampoProduto label="Categoria">
              <Field className="w-full" placeholder="Categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)} />
            </CampoProduto>
            <CampoProduto label="Quantidade">
              <Field className="w-full" type="number" placeholder="Quantidade" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} />
            </CampoProduto>
            <CampoProduto label={"Pre\u00e7o unit\u00e1rio"}>
              <Field className="w-full" type="number" step="0.01" placeholder={"Pre\u00e7o unit\u00e1rio"} value={preco} onChange={(event) => setPreco(event.target.value)} />
            </CampoProduto>
            <CampoProduto label={"Estoque m\u00ednimo"}>
              <Field className="w-full" type="number" placeholder={`Estoque m\u00ednimo (padr\u00e3o: ${estoqueMinimoPadrao})`} value={estoqueMinimo} onChange={(event) => setEstoqueMinimo(event.target.value)} />
            </CampoProduto>
            <CampoProduto label={"Pre\u00e7o total"}>
              <Field readOnly value={precoTotalFormulario ? formatarMoeda(precoTotalFormulario) : ""} placeholder={"Pre\u00e7o total"} className="w-full bg-[#f7f8f7] font-bold text-[#00743d]" />
            </CampoProduto>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-black/10 bg-[#f8faf8] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ProductImage src={imagemPreview || imagemAtual} name={nome || "Produto"} />
              <div>
                <p className="text-sm font-extrabold text-[#08271f]">Imagem do produto</p>
                <p className="text-xs text-black/50">{"PNG, JPG ou WEBP at\u00e9 4 MB"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-bold text-[#08271f] transition hover:border-[#006d3f] hover:text-[#006d3f]">
                <ImageIcon size={16} />
                Escolher imagem
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherImagem} className="hidden" />
              </label>
              {(imagemPreview || imagemAtual) ? (
                <button
                  type="button"
                  onClick={removerImagem}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <X size={16} />
                  Remover
                </button>
              ) : null}
            </div>
          </div>

          <PrimaryButton onClick={salvarProduto} className="mt-5">
            <Plus size={18} />
            {idEdicao ? "Atualizar Produto" : "Salvar Produto"}
          </PrimaryButton>
        </PageCard>

        <PageCard className="p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-extrabold">Lista de Produtos</h2>
            <Field
              className="md:w-96"
              placeholder="Pesquisar produto..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3 font-bold">Produto</th>
                  <th className="pb-3 font-bold">Categoria</th>
                  <th className="pb-3 font-bold">Quantidade</th>
                  <th className="pb-3 font-bold">{"Estoque m\u00ednimo"}</th>
                  <th className="pb-3 font-bold">{"Pre\u00e7o unit\u00e1rio"}</th>
                  <th className="pb-3 font-bold">{"Pre\u00e7o total"}</th>
                  <th className="pb-3 text-right font-bold">{"A\u00e7\u00f5es"}</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="border-b border-black/7 last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <ProductImage src={produto.imagem_url} name={produto.nome} />
                        <span className="font-semibold">{produto.nome}</span>
                      </div>
                    </td>
                    <td className="py-4">{produto.categoria}</td>
                    <td className="py-4">{produto.quantidade}</td>
                    <td className="py-4">{produto.estoque_minimo || 30}</td>
                    <td className="py-4 font-bold text-[#00743d]">
                      {formatarMoeda(produto.preco)}
                    </td>
                    <td className="py-4 font-bold text-[#08271f]">
                      {formatarMoeda((produto.quantidade || 0) * (produto.preco || 0))}
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => editarProduto(produto)}
                          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#e2a827] px-4 text-sm font-bold text-white transition hover:bg-[#c9921f]"
                        >
                          <Edit size={16} />
                          Editar
                        </button>
                        <DangerButton onClick={() => excluirProduto(produto.id)}>
                          <Trash2 size={16} />
                          Excluir
                        </DangerButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-black/50">
                      Nenhum produto encontrado.
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



