import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Eye,
  Gift,
  Headphones,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { clearAuthSession, isAuthenticated, setAuthSession } from "../utils/auth";
import { mensagemDeErro } from "../utils/download";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    function syncLoginState() {
      if (isAuthenticated()) {
        navigate("/", { replace: true });
      }
    }

    syncLoginState();
    window.addEventListener("storage", syncLoginState);
    return () => window.removeEventListener("storage", syncLoginState);
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }

    try {
      clearAuthSession();
      const response = await axios.post("http://127.0.0.1:8000/auth/login", {
        email: email.trim().toLowerCase(),
        senha,
        lembrar: remember,
      });

      setAuthSession({
        token: response.data.token,
        usuario: response.data.usuario,
        remember,
      });
      navigate("/");
    } catch (error) {
      console.error(error);
      setErro(mensagemDeErro(error, "Não foi possível entrar agora. Tente novamente."));
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f7f4] text-[#06271f]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
        <section className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-[#003427] px-10 py-12 text-center text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(3,98,70,0.72),transparent_34%),linear-gradient(135deg,#003427_0%,#012e24_48%,#001f19_100%)]" />
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle_at_20px_20px,rgba(224,170,47,0.18)_1.4px,transparent_1.5px)] [background-size:42px_42px]" />
          <div className="absolute -right-20 top-0 h-full w-56 rounded-l-[50%] border-l-[14px] border-[#d8a83a] bg-[#fbfaf7]" />
          <div className="absolute bottom-0 left-0 h-52 w-full bg-gradient-to-t from-black/25 to-transparent" />

          <div className="relative z-10 flex max-w-2xl flex-col items-center">
            <div className="relative mb-9 flex h-72 w-72 items-center justify-center rounded-[42%] border-[6px] border-[#d8a83a] bg-[#003d2e] shadow-[0_28px_70px_rgba(0,0,0,0.45)] outline outline-2 outline-offset-[-22px] outline-[#f3d37a]">
              <div className="absolute inset-8 rounded-[42%] border border-[#c8972c]/70" />
              <Sparkles className="mb-28 h-14 w-14 text-[#e9c35b]" strokeWidth={1.5} />
              <div className="absolute text-center">
                <div className="font-serif text-[4.35rem] leading-none tracking-[0.12em] text-[#e4bc58] drop-shadow">
                  BARAKAH
                </div>
                <div className="mt-3 font-serif text-[2.2rem] tracking-[0.42em] text-[#e4bc58]">
                  DECOR
                </div>
                <div className="mx-auto mt-7 h-px w-44 bg-[#d8a83a]" />
              </div>
            </div>

            <p className="font-serif text-xl uppercase tracking-[0.3em] text-[#e8c766]">
              Embalagens e decorações
            </p>
            <p className="mt-2 font-serif text-2xl uppercase tracking-[0.24em] text-white">
              que transformam momentos
            </p>
            <div className="mt-7 flex items-center gap-4 text-[#d8a83a]">
              <span className="h-px w-24 bg-[#d8a83a]" />
              <Gift className="h-6 w-6" strokeWidth={1.7} />
              <span className="h-px w-24 bg-[#d8a83a]" />
            </div>
          </div>

          <div className="absolute bottom-0 left-7 h-40 w-44 rounded-t-[18px] border border-[#d8a83a]/50 bg-gradient-to-br from-[#053f31] to-[#01261e] shadow-2xl">
            <div className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2 bg-gradient-to-b from-[#f1cf70] to-[#a96f1b]" />
            <div className="absolute left-0 top-1/2 h-5 w-full -translate-y-1/2 bg-gradient-to-r from-[#f1cf70] to-[#a96f1b]" />
          </div>
          <div className="absolute bottom-7 left-52 h-20 w-80 rotate-[-8deg] rounded-full border border-[#cf9d37]/70 bg-gradient-to-r from-[#d0a24c] via-[#044333] to-[#d0a24c] shadow-xl" />
          <div className="absolute bottom-3 left-80 h-24 w-24 rounded-full border-[14px] border-[#d8a83a] bg-[#063d30] shadow-xl" />
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:bg-[#fbfaf7]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_16%,rgba(224,170,47,0.12),transparent_28%),radial-gradient(circle_at_30%_82%,rgba(0,77,60,0.08),transparent_30%)]" />

          <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center gap-5">
            <form
              onSubmit={handleSubmit}
              className="w-full rounded-[28px] border border-white/80 bg-white/86 px-7 py-7 shadow-[0_24px_70px_rgba(20,30,26,0.18)] backdrop-blur sm:px-10 sm:py-8"
            >
              <div className="flex flex-col items-center text-center">
                <img
                  src="/logo.png"
                  alt="Barakah Decor"
                  className="h-24 w-24 rounded-2xl object-contain"
                />
                <h1 className="mt-3 font-serif text-3xl font-bold text-[#08271f]">
                  Bem-vindo de volta!
                </h1>
                <p className="mt-2 text-base text-slate-600">
                  Faça login para acessar o sistema
                </p>
                <p className="mt-1 text-base text-slate-600">Barakah Decor</p>
              </div>

              <div className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#08271f]">
                    E-mail
                  </span>
                  <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 shadow-inner shadow-slate-100 focus-within:border-[#006d3f] focus-within:ring-4 focus-within:ring-[#006d3f]/10">
                    <Mail className="h-5 w-5" strokeWidth={1.8} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setErro("");
                      }}
                      placeholder="Digite seu e-mail"
                      autoComplete="email"
                      className="h-full flex-1 bg-transparent text-base text-[#08271f] outline-none placeholder:text-slate-400"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#08271f]">
                    Senha
                  </span>
                  <span className="flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-slate-500 shadow-inner shadow-slate-100 focus-within:border-[#006d3f] focus-within:ring-4 focus-within:ring-[#006d3f]/10">
                    <LockKeyhole className="h-5 w-5" strokeWidth={1.8} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(event) => {
                        setSenha(event.target.value);
                        setErro("");
                      }}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      className="h-full flex-1 bg-transparent text-base text-[#08271f] outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-[#006d3f]"
                      aria-label="Mostrar ou ocultar senha"
                    >
                      <Eye className="h-5 w-5" strokeWidth={1.8} />
                    </button>
                  </span>
                </label>
              </div>

              {erro ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {erro}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 accent-[#006d3f]"
                  />
                  Lembrar-me
                </label>
                <button
                  type="button"
                  className="font-medium text-[#00513d] transition hover:text-[#d19a28]"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                className="mt-7 flex h-16 w-full items-center justify-center gap-4 rounded-xl bg-gradient-to-r from-[#006d3f] to-[#003d2e] font-serif text-xl font-bold text-[#f3c95b] shadow-[0_16px_35px_rgba(0,77,60,0.28)] transition hover:brightness-110"
              >
                Entrar
                <ArrowRight className="h-6 w-6" strokeWidth={1.8} />
              </button>

              <div className="my-6 flex items-center gap-3 text-sm text-slate-500">
                <span className="h-px flex-1 bg-slate-300" />
                ou continue com
                <span className="h-px flex-1 bg-slate-300" />
              </div>

              <button
                type="button"
                className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-base font-medium text-slate-700 transition hover:border-[#006d3f] hover:bg-[#f6fbf8]"
              >
                <span className="text-xl font-bold text-[#4285f4]">G</span>
                Entrar com Google
              </button>
            </form>

            <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#00513d]" />
                Seguro e confiável
              </span>
              <span className="h-6 w-px bg-slate-300" />
              <span className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-[#00513d]" />
                Suporte dedicado
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
