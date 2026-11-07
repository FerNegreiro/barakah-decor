import { useEffect, useState } from "react";
import axios from "axios";
import { KeyRound, Mail, Save, ShieldCheck, Trash2, UserCog, UserPlus, UsersRound } from "lucide-react";

import { AppLayout, DangerButton, Field, PageCard, PrimaryButton, SelectField } from "../components/AppLayout";
import { getCurrentUser } from "../utils/currentUser";
import { mensagemDeErro } from "../utils/download";

const PERFIS = ["Administrador", "Operador"];
const formularioVazio = { nome: "", email: "", perfil: "Operador", senha: "" };
const URL_USUARIOS = "http://127.0.0.1:8000/usuarios";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [formulario, setFormulario] = useState(formularioVazio);
  const [mensagem, setMensagem] = useState({ texto: "", erro: false });
  const [salvando, setSalvando] = useState(false);
  const [redefinindoId, setRedefinindoId] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");
  const emailAtual = getCurrentUser().email;

  async function carregarUsuarios() {
    try {
      const response = await axios.get(URL_USUARIOS);
      setUsuarios(response.data || []);
    } catch (error) {
      setMensagem({ texto: mensagemDeErro(error, "Não foi possível carregar os usuários."), erro: true });
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function avisar(texto, erro = false) {
    setMensagem({ texto, erro });
  }

  function atualizarCampo(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function salvarUsuario() {
    if (!formulario.nome.trim() || !formulario.email.trim() || !formulario.senha) {
      avisar("Preencha nome, e-mail e senha inicial.", true);
      return;
    }

    if (formulario.senha.length < 8) {
      avisar("A senha inicial precisa ter pelo menos 8 caracteres.", true);
      return;
    }

    try {
      setSalvando(true);
      await axios.post(URL_USUARIOS, formulario);
      setFormulario(formularioVazio);
      avisar("Usuário criado. Passe a senha inicial para a pessoa e peça para ela trocar em Configurações.");
      carregarUsuarios();
    } catch (error) {
      avisar(mensagemDeErro(error, "Não foi possível criar o usuário."), true);
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarUsuario(id, dados) {
    try {
      await axios.put(`${URL_USUARIOS}/${id}`, dados);
      avisar("Usuário atualizado.");
      carregarUsuarios();
    } catch (error) {
      avisar(mensagemDeErro(error, "Não foi possível atualizar o usuário."), true);
    }
  }

  async function removerUsuario(usuario) {
    if (!window.confirm(`Excluir o acesso de ${usuario.nome}? Essa ação não pode ser desfeita.`)) return;

    try {
      await axios.delete(`${URL_USUARIOS}/${usuario.id}`);
      avisar("Usuário removido.");
      carregarUsuarios();
    } catch (error) {
      avisar(mensagemDeErro(error, "Não foi possível remover o usuário."), true);
    }
  }

  async function redefinirSenha(id) {
    if (novaSenha.length < 8) {
      avisar("A nova senha precisa ter pelo menos 8 caracteres.", true);
      return;
    }

    try {
      const response = await axios.post(`${URL_USUARIOS}/${id}/redefinir-senha`, { nova_senha: novaSenha });
      avisar(response.data?.mensagem || "Senha redefinida.");
      setRedefinindoId(null);
      setNovaSenha("");
    } catch (error) {
      avisar(mensagemDeErro(error, "Não foi possível redefinir a senha."), true);
    }
  }

  const admins = usuarios.filter((usuario) => usuario.perfil === "Administrador").length;
  const ativos = usuarios.filter((usuario) => usuario.status === "Ativo").length;

  return (
    <AppLayout title="Usuários" subtitle="Gerencie quem pode acessar o sistema.">
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-3">
          <PageCard className="bg-[#ecf6ef] p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-black/60">Usuários</p>
              <UsersRound className="text-[#00743d]" size={24} />
            </div>
            <p className="text-3xl font-extrabold text-[#00743d]">{usuarios.length}</p>
          </PageCard>
          <PageCard className="bg-[#ecf6ef] p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-black/60">Ativos</p>
              <ShieldCheck className="text-[#00743d]" size={24} />
            </div>
            <p className="text-3xl font-extrabold text-[#00743d]">{ativos}</p>
          </PageCard>
          <PageCard className="bg-amber-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-black/60">Administradores</p>
              <UserCog className="text-[#d69200]" size={24} />
            </div>
            <p className="text-3xl font-extrabold text-[#d69200]">{admins}</p>
          </PageCard>
        </section>

        <PageCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ecf6ef] text-[#00743d]">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Novo Usuário</h2>
              <p className="text-sm text-black/55">Operadores usam o sistema no dia a dia. Administradores também gerenciam usuários e configurações.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Field placeholder="Nome" value={formulario.nome} onChange={(event) => atualizarCampo("nome", event.target.value)} />
            <Field type="email" placeholder="E-mail" value={formulario.email} onChange={(event) => atualizarCampo("email", event.target.value)} />
            <SelectField value={formulario.perfil} onChange={(event) => atualizarCampo("perfil", event.target.value)}>
              {PERFIS.map((perfil) => (
                <option key={perfil}>{perfil}</option>
              ))}
            </SelectField>
            <Field
              type="password"
              autoComplete="new-password"
              placeholder="Senha inicial (mín. 8 caracteres)"
              value={formulario.senha}
              onChange={(event) => atualizarCampo("senha", event.target.value)}
            />
          </div>

          <PrimaryButton onClick={salvarUsuario} disabled={salvando} className="mt-5">
            <Save size={18} />
            {salvando ? "Salvando..." : "Criar Usuário"}
          </PrimaryButton>

          {mensagem.texto ? (
            <p className={`mt-3 text-sm font-bold ${mensagem.erro ? "text-red-700" : "text-[#00743d]"}`}>{mensagem.texto}</p>
          ) : null}
        </PageCard>

        <PageCard className="p-6">
          <h2 className="mb-5 text-lg font-extrabold">Usuários Cadastrados</h2>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs text-black/60">
                <tr>
                  <th className="pb-3">Nome</th>
                  <th className="pb-3">E-mail</th>
                  <th className="pb-3">Perfil</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => {
                  const ehVoce = usuario.email === emailAtual;
                  return (
                    <tr key={usuario.id} className="border-b border-black/7 last:border-0">
                      <td className="py-4 font-semibold">
                        {usuario.nome}
                        {ehVoce ? <span className="ml-2 text-xs font-bold text-black/45">(você)</span> : null}
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-2 text-black/65">
                          <Mail size={15} />
                          {usuario.email}
                        </span>
                      </td>
                      <td className="py-4">
                        <SelectField
                          className="h-9 px-2 text-xs font-bold"
                          value={usuario.perfil}
                          disabled={ehVoce}
                          onChange={(event) => atualizarUsuario(usuario.id, { perfil: event.target.value })}
                        >
                          {PERFIS.map((perfil) => (
                            <option key={perfil}>{perfil}</option>
                          ))}
                        </SelectField>
                      </td>
                      <td className="py-4">
                        <button
                          type="button"
                          disabled={ehVoce}
                          onClick={() => atualizarUsuario(usuario.id, { status: usuario.status === "Ativo" ? "Pausado" : "Ativo" })}
                          className={`rounded-md px-3 py-1 text-xs font-bold disabled:cursor-not-allowed ${usuario.status === "Ativo" ? "bg-green-50 text-[#00743d]" : "bg-amber-50 text-[#d69200]"}`}
                        >
                          {usuario.status}
                        </button>
                      </td>
                      <td className="py-4">
                        {ehVoce ? (
                          <p className="text-right text-xs text-black/45">Troque sua senha em Configurações</p>
                        ) : redefinindoId === usuario.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Field
                              className="h-10 w-52"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Nova senha"
                              value={novaSenha}
                              onChange={(event) => setNovaSenha(event.target.value)}
                            />
                            <PrimaryButton className="h-10" onClick={() => redefinirSenha(usuario.id)}>
                              Salvar
                            </PrimaryButton>
                            <button
                              type="button"
                              onClick={() => {
                                setRedefinindoId(null);
                                setNovaSenha("");
                              }}
                              className="h-10 rounded-lg px-3 text-sm font-bold text-black/60 hover:bg-black/5"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRedefinindoId(usuario.id);
                                setNovaSenha("");
                              }}
                              className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-bold text-[#08271f] hover:bg-black/5"
                            >
                              <KeyRound size={16} />
                              Redefinir senha
                            </button>
                            <DangerButton onClick={() => removerUsuario(usuario)}>
                              <Trash2 size={16} />
                              Excluir
                            </DangerButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PageCard>
      </div>
    </AppLayout>
  );
}
