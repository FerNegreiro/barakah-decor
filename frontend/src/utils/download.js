import axios from "axios";

function nomeDoArquivo(contentDisposition, nomePadrao) {
  const encontrado = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return encontrado ? encontrado[1] : nomePadrao;
}

export async function baixarArquivo(url, nomePadrao) {
  const response = await axios.get(url, { responseType: "blob" });
  const nome = nomeDoArquivo(response.headers["content-disposition"], nomePadrao);
  const linkTemporario = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = linkTemporario;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(linkTemporario);
}

export function mensagemDeErro(error, padrao) {
  const detalhe = error?.response?.data?.detail;
  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe) && detalhe[0]?.msg) return "Confira os valores informados.";
  return padrao;
}
