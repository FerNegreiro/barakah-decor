import { Image as ImageIcon, Package } from "lucide-react";

import { resolveImageUrl } from "../utils/api";

const tamanhos = {
  sm: { caixa: "h-10 w-10", icone: 18 },
  md: { caixa: "h-12 w-12", icone: 20 },
};

export default function ProductImage({ src, name, size = "md" }) {
  const tamanho = tamanhos[size] || tamanhos.md;

  if (src) {
    return (
      <img
        src={resolveImageUrl(src)}
        alt={name}
        className={`${tamanho.caixa} rounded-lg border border-black/10 object-cover shadow-sm`}
      />
    );
  }

  if (size === "sm") {
    return (
      <div className={`grid ${tamanho.caixa} place-items-center rounded-lg bg-[#ecf6ef] text-[#00743d]`}>
        <Package size={tamanho.icone} />
      </div>
    );
  }

  return (
    <div className={`grid ${tamanho.caixa} place-items-center rounded-lg border border-dashed border-black/15 bg-[#ecf6ef] text-[#00743d]`}>
      <ImageIcon size={tamanho.icone} />
    </div>
  );
}
