const nomesDosMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function formatCurrency(value) {
  const numero = Number(String(value ?? 0).replace(",", "."));
  return (Number.isFinite(numero) ? numero : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ordenarProdutosPorNome(produtos) {
  return [...produtos].sort((a, b) =>
    String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
  );
}

export function dataDeHoje() {
  const hoje = new Date();
  return `Hoje, ${hoje.getDate()} de ${nomesDosMeses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}
