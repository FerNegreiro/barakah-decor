import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";

import { AppLayout, DangerButton, Field, PageCard, PrimaryButton } from "../components/AppLayout";

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");

  async function carregarFornecedores() {
    try {
      const response = await axios.get("http://127.0.0.1:8000/fornecedores");
      setFornecedores(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  async function salvarFornecedor() {
    if (!nome || !responsavel || !telefone || !email || !cidade) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/fornecedores", {
        nome,
        responsavel,
        telefone,
        email,
        cidade,
      });

      alert("Fornecedor cadastrado com sucesso!");
      setNome("");
      setResponsavel("");
      setTelefone("");
      setEmail("");
      setCidade("");
      carregarFornecedores();
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar fornecedor");
    }
  }

  async function excluirFornecedor(id) {
    try {
      await axios.delete(`http://127.0.0.1:8000/fornecedores/${id}`);
      carregarFornecedores();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir fornecedor");
    }
  }

  useEffect(() => {
    carregarFornecedores();
  }, []);

  return (
    <AppLayout title="Fornecedores" subtitle="Cadastre contatos e acompanhe quem abastece o estoque.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Novo Fornecedor</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field placeholder="Nome da empresa" value={nome} onChange={(event) => setNome(event.target.value)} />
            <Field placeholder="Responsável" value={responsavel} onChange={(event) => setResponsavel(event.target.value)} />
            <Field placeholder="Telefone" value={telefone} onChange={(event) => setTelefone(event.target.value)} />
            <Field type="email" placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Field placeholder="Cidade" value={cidade} onChange={(event) => setCidade(event.target.value)} />
          </div>
          <PrimaryButton onClick={salvarFornecedor} className="mt-5">
            <Plus size={18} />
            Salvar Fornecedor
          </PrimaryButton>
        </PageCard>

        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Lista de Fornecedores</h2>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3 font-bold">Empresa</th>
                  <th className="pb-3 font-bold">Responsável</th>
                  <th className="pb-3 font-bold">Telefone</th>
                  <th className="pb-3 font-bold">E-mail</th>
                  <th className="pb-3 font-bold">Cidade</th>
                  <th className="pb-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id} className="border-b border-black/7 last:border-0">
                    <td className="py-4 font-semibold">{fornecedor.nome}</td>
                    <td className="py-4">{fornecedor.responsavel}</td>
                    <td className="py-4">{fornecedor.telefone}</td>
                    <td className="py-4 text-[#006d3f]">{fornecedor.email}</td>
                    <td className="py-4">{fornecedor.cidade}</td>
                    <td className="py-4 text-right">
                      <DangerButton onClick={() => excluirFornecedor(fornecedor.id)}>
                        <Trash2 size={16} />
                        Excluir
                      </DangerButton>
                    </td>
                  </tr>
                ))}
                {fornecedores.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-black/50">
                      Nenhum fornecedor cadastrado.
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

