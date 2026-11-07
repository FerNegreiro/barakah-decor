import axios from "axios";
import { useEffect, useState } from "react";
import { AlertTriangle, BellRing, Building2, KeyRound, Palette, Save, ShieldCheck, Trash2 } from "lucide-react";

import { AppLayout, Field, PageCard, PrimaryButton } from "../components/AppLayout";
import { isAdmin } from "../utils/currentUser";
import { mensagemDeErro } from "../utils/download";

const defaultConfig = {
  empresa: "Barakah Decor",
  telefone: "",
  email: "",
  cidade: "",
  whatsapp: "",
  estoque_minimo_padrao: 30,
  percentual_critico: 66,
};

function CampoComRotulo({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-extrabold uppercase tracking-wide text-black/45">{label}</span>
      {children}
    </label>
  );
}

export default function Configuracoes() {
  const [config, setConfig] = useState(defaultConfig);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroConfig, setErroConfig] = useState("");
  const podeEditar = isAdmin();
  const [confirmacao, setConfirmacao] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [limpando, setLimpando] = useState(false);
  const [mensagemLimpeza, setMensagemLimpeza] = useState("");
  const [senhas, setSenhas] = useState({ atual: "", nova: "", repetir: "" });
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [mensagemSenha, setMensagemSenha] = useState({ texto: "", erro: false });

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/configuracoes")
      .then((response) => setConfig({ ...defaultConfig, ...response.data }))
      .catch((error) => setErroConfig(mensagemDeErro(error, "Não foi possível carregar as configurações.")));
  }, []);

  function updateConfig(field, value) {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSalvo(false);
    setErroConfig("");
  }

  async function salvarConfiguracoes() {
    const estoqueMinimo = parseInt(config.estoque_minimo_padrao, 10);
    const percentualCritico = parseInt(config.percentual_critico, 10);

    if (!estoqueMinimo || estoqueMinimo < 1) {
      setErroConfig("O estoque mínimo padrão precisa ser maior que zero.");
      return;
    }

    if (!percentualCritico || percentualCritico < 1 || percentualCritico > 99) {
      setErroConfig("O percentual crítico precisa ficar entre 1 e 99.");
      return;
    }

    try {
      setSalvando(true);
      const response = await axios.put("http://127.0.0.1:8000/configuracoes", {
        ...config,
        estoque_minimo_padrao: estoqueMinimo,
        percentual_critico: percentualCritico,
      });
      setConfig({ ...defaultConfig, ...response.data });
      setSalvo(true);
    } catch (error) {
      setErroConfig(mensagemDeErro(error, "Não foi possível salvar as configurações."));
    } finally {
      setSalvando(false);
    }
  }

  function atualizarSenha(campo, valor) {
    setSenhas((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function alterarSenha() {
    if (!senhas.atual || !senhas.nova) {
      setMensagemSenha({ texto: "Preencha a senha atual e a nova senha.", erro: true });
      return;
    }

    if (senhas.nova.length < 8) {
      setMensagemSenha({ texto: "A nova senha precisa ter pelo menos 8 caracteres.", erro: true });
      return;
    }

    if (senhas.nova !== senhas.repetir) {
      setMensagemSenha({ texto: "A confirmação não confere com a nova senha.", erro: true });
      return;
    }

    try {
      setAlterandoSenha(true);
      await axios.post("http://127.0.0.1:8000/auth/alterar-senha", {
        senha_atual: senhas.atual,
        nova_senha: senhas.nova,
      });
      setSenhas({ atual: "", nova: "", repetir: "" });
      setMensagemSenha({ texto: "Senha alterada com sucesso.", erro: false });
    } catch (error) {
      setMensagemSenha({ texto: mensagemDeErro(error, "Não foi possível alterar a senha."), erro: true });
    } finally {
      setAlterandoSenha(false);
    }
  }

  async function zerarDados() {
    if (confirmacao !== "ZERAR") {
      setMensagemLimpeza("Digite ZERAR para confirmar.");
      return;
    }

    if (!senhaConfirmacao) {
      setMensagemLimpeza("Digite sua senha para confirmar.");
      return;
    }

    const aceitou = window.confirm("Isso vai apagar produtos, entradas, saídas, vendas, compras, financeiro, fornecedores e categorias. O login será mantido. Deseja continuar?");
    if (!aceitou) return;

    try {
      setLimpando(true);
      setMensagemLimpeza("");
      await axios.post("http://127.0.0.1:8000/sistema/zerar-dados", {
        confirmar: confirmacao,
        senha: senhaConfirmacao,
      });
      setConfirmacao("");
      setMensagemLimpeza("Dados apagados. O sistema está pronto para o cliente começar.");
    } catch (error) {
      setMensagemLimpeza(mensagemDeErro(error, "Não foi possível zerar os dados agora. Tente novamente."));
    } finally {
      setSenhaConfirmacao("");
      setLimpando(false);
    }
  }

  return (
    <AppLayout title="Configurações" subtitle="Ajuste dados da empresa, alertas e preferências do sistema.">
      <div className="space-y-5">
        <PageCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ecf6ef] text-[#00743d]">
              <Building2 size={22} />
            </div>
            <h2 className="text-lg font-extrabold">Dados da Empresa</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CampoComRotulo label="Nome da empresa">
              <Field className="w-full" placeholder="Barakah Decor" disabled={!podeEditar} value={config.empresa} onChange={(event) => updateConfig("empresa", event.target.value)} />
            </CampoComRotulo>
            <CampoComRotulo label="Telefone (opcional)">
              <Field className="w-full" placeholder="Adicionar telefone" disabled={!podeEditar} value={config.telefone} onChange={(event) => updateConfig("telefone", event.target.value)} />
            </CampoComRotulo>
            <CampoComRotulo label="E-mail (opcional)">
              <Field className="w-full" type="email" placeholder="Adicionar e-mail" disabled={!podeEditar} value={config.email} onChange={(event) => updateConfig("email", event.target.value)} />
            </CampoComRotulo>
            <CampoComRotulo label="Cidade (opcional)">
              <Field className="w-full" placeholder="Adicionar cidade" disabled={!podeEditar} value={config.cidade} onChange={(event) => updateConfig("cidade", event.target.value)} />
            </CampoComRotulo>
            <CampoComRotulo label="WhatsApp (opcional)">
              <Field className="w-full" placeholder="Adicionar WhatsApp" disabled={!podeEditar} value={config.whatsapp} onChange={(event) => updateConfig("whatsapp", event.target.value)} />
            </CampoComRotulo>
          </div>
        </PageCard>

        <section className="grid gap-5 xl:grid-cols-2">
          <PageCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-[#d69200]">
                <BellRing size={22} />
              </div>
              <h2 className="text-lg font-extrabold">Regras de Alerta</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <CampoComRotulo label="Estoque mínimo padrão">
                <Field
                  className="w-full"
                  type="number"
                  min="1"
                  disabled={!podeEditar}
                  value={config.estoque_minimo_padrao}
                  onChange={(event) => updateConfig("estoque_minimo_padrao", event.target.value)}
                />
              </CampoComRotulo>
              <CampoComRotulo label="Crítico abaixo de (% do mínimo)">
                <Field
                  className="w-full"
                  type="number"
                  min="1"
                  max="99"
                  disabled={!podeEditar}
                  value={config.percentual_critico}
                  onChange={(event) => updateConfig("percentual_critico", event.target.value)}
                />
              </CampoComRotulo>
            </div>
            <p className="mt-4 text-sm leading-6 text-black/55">
              Cada produto entra em alerta quando chega ao seu estoque mínimo. O padrão acima vale para produtos cadastrados sem mínimo próprio.
            </p>
          </PageCard>

          <PageCard className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ecf6ef] text-[#00743d]">
                <Palette size={22} />
              </div>
              <h2 className="text-lg font-extrabold">Resumo das Preferências</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-[#f7f8f7] p-4">
                <p className="text-xs font-bold text-black/45">Empresa</p>
                <p className="mt-1 font-extrabold">{config.empresa || "Não informado"}</p>
              </div>
              <div className="rounded-lg bg-[#f7f8f7] p-4">
                <p className="text-xs font-bold text-black/45">Alerta de estoque</p>
                <p className="mt-1 font-extrabold">Mínimo padrão de {config.estoque_minimo_padrao} un | Crítico abaixo de {config.percentual_critico}% do mínimo</p>
              </div>
              <div className="rounded-lg bg-[#f7f8f7] p-4">
                <p className="text-xs font-bold text-black/45">Segurança</p>
                <p className="mt-1 flex items-center gap-2 font-extrabold text-[#00743d]">
                  <ShieldCheck size={17} />
                  Acesso protegido por login
                </p>
              </div>
            </div>
          </PageCard>
        </section>

        <PageCard className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#ecf6ef] text-[#00743d]">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Alterar senha</h2>
              <p className="text-sm text-black/55">Ao trocar a senha, os outros aparelhos conectados serão desconectados.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <Field
              type="password"
              autoComplete="current-password"
              placeholder="Senha atual"
              value={senhas.atual}
              onChange={(event) => atualizarSenha("atual", event.target.value)}
            />
            <Field
              type="password"
              autoComplete="new-password"
              placeholder="Nova senha (mín. 8 caracteres)"
              value={senhas.nova}
              onChange={(event) => atualizarSenha("nova", event.target.value)}
            />
            <Field
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={senhas.repetir}
              onChange={(event) => atualizarSenha("repetir", event.target.value)}
            />
            <PrimaryButton onClick={alterarSenha} disabled={alterandoSenha}>
              <KeyRound size={18} />
              {alterandoSenha ? "Salvando..." : "Alterar"}
            </PrimaryButton>
          </div>
          {mensagemSenha.texto ? (
            <p className={`mt-3 text-sm font-bold ${mensagemSenha.erro ? "text-red-700" : "text-[#00743d]"}`}>{mensagemSenha.texto}</p>
          ) : null}
        </PageCard>

        {podeEditar ? (
        <PageCard className="border border-red-100 bg-red-50/30 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Começar com o sistema zerado</h2>
              <p className="text-sm text-black/55">Use apenas para apagar dados de teste antes de entregar ao cliente. Somente administradores podem fazer isso, e o usuário de login será mantido.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Field
              placeholder="Digite ZERAR para confirmar"
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
            />
            <Field
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha de administrador"
              value={senhaConfirmacao}
              onChange={(event) => setSenhaConfirmacao(event.target.value)}
            />
            <button
              type="button"
              onClick={zerarDados}
              disabled={limpando}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={17} />
              {limpando ? "Zerando..." : "Zerar dados"}
            </button>
          </div>
          {mensagemLimpeza ? <p className="mt-3 text-sm font-bold text-red-700">{mensagemLimpeza}</p> : null}
        </PageCard>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {podeEditar ? (
            <PrimaryButton onClick={salvarConfiguracoes} disabled={salvando}>
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Configurações"}
            </PrimaryButton>
          ) : (
            <span className="text-sm font-bold text-black/55">Somente administradores podem alterar as configurações.</span>
          )}
          {salvo ? <span className="text-sm font-bold text-[#00743d]">Configurações salvas com sucesso.</span> : null}
          {erroConfig ? <span className="text-sm font-bold text-red-700">{erroConfig}</span> : null}
        </div>
      </div>
    </AppLayout>
  );
}
