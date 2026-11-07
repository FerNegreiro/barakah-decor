const CHAVE_USUARIO = "barakah_current_user";

export function getCurrentUser() {
  try {
    const salvo = localStorage.getItem(CHAVE_USUARIO);
    const usuario = salvo ? JSON.parse(salvo) : {};
    return {
      nome: usuario.nome || "Usuário",
      email: usuario.email || "",
      cargo: usuario.cargo || usuario.perfil || "",
    };
  } catch {
    return { nome: "Usuário", email: "", cargo: "" };
  }
}

export function salvarUsuarioAtual(usuario) {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function limparUsuarioAtual() {
  localStorage.removeItem(CHAVE_USUARIO);
}

export function isAdmin() {
  return getCurrentUser().cargo === "Administrador";
}

export function getUserInitial(nome) {
  return (nome || "U").trim().charAt(0).toUpperCase();
}
