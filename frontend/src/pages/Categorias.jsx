import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";

import { AppLayout, DangerButton, Field, PageCard, PrimaryButton } from "../components/AppLayout";

export default function Categorias() {
  const [nome, setNome] = useState("");
  const [categorias, setCategorias] = useState([]);

  async function carregarCategorias() {
    try {
      const response = await axios.get("http://127.0.0.1:8000/categorias");
      setCategorias(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function salvarCategoria() {
    if (!nome.trim()) {
      alert("Digite uma categoria");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/categorias", { nome: nome.trim() });
      setNome("");
      carregarCategorias();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar categoria");
    }
  }

  async function excluirCategoria(id) {
    try {
      await axios.delete(`http://127.0.0.1:8000/categorias/${id}`);
      carregarCategorias();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir categoria");
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  return (
    <AppLayout title="Categorias" subtitle="Organize os produtos por grupos de venda e estoque.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Nova Categoria</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <Field
              className="flex-1"
              placeholder="Nome da categoria"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
            />
            <PrimaryButton onClick={salvarCategoria}>
              <Plus size={18} />
              Salvar Categoria
            </PrimaryButton>
          </div>
        </PageCard>

        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Categorias Cadastradas</h2>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3 font-bold">Categoria</th>
                  <th className="pb-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id} className="border-b border-black/7 last:border-0">
                    <td className="py-4 font-semibold">{categoria.nome}</td>
                    <td className="py-4 text-right">
                      <DangerButton onClick={() => excluirCategoria(categoria.id)}>
                        <Trash2 size={16} />
                        Excluir
                      </DangerButton>
                    </td>
                  </tr>
                ))}
                {categorias.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="py-10 text-center text-black/50">
                      Nenhuma categoria cadastrada.
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

