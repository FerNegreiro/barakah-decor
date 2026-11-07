import axios from "axios";

import { limparUsuarioAtual, salvarUsuarioAtual } from "./currentUser";

const TOKEN_KEY = "barakah_auth_token";
const CHAVES_ANTIGAS = ["barakah_logged_in", "barakah_usuarios", "barakah_configuracoes"];

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function setAuthSession({ token, usuario, remember }) {
  const storage = remember ? localStorage : sessionStorage;
  clearAuthSession();
  storage.setItem(TOKEN_KEY, token);
  salvarUsuarioAtual(usuario);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  limparUsuarioAtual();
  CHAVES_ANTIGAS.forEach((chave) => {
    localStorage.removeItem(chave);
    sessionStorage.removeItem(chave);
  });
}

export async function encerrarSessao() {
  if (getAuthToken()) {
    await axios.post("http://127.0.0.1:8000/auth/logout").catch(() => null);
  }
  clearAuthSession();
}
