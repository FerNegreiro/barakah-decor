import base64
import re
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import ImagemProduto
from schemas import ProdutoImagem

TIPOS_PERMITIDOS = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}
TAMANHO_MAXIMO = 4 * 1024 * 1024
PREFIXO_URL = "/uploads/produtos/"


def salvar_imagem_produto(imagem: ProdutoImagem, db: Session):
    nome_original = imagem.nome_arquivo or "produto.png"
    extensao = ""
    if "." in nome_original:
        extensao = "." + nome_original.rsplit(".", 1)[-1].lower()

    if extensao not in TIPOS_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Use uma imagem PNG, JPG, JPEG ou WEBP.")

    conteudo = re.sub(r"^data:image/[^;]+;base64,", "", imagem.conteudo or "")

    try:
        bytes_imagem = base64.b64decode(conteudo, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Imagem inválida.") from exc

    if not bytes_imagem:
        raise HTTPException(status_code=400, detail="Imagem inválida.")

    if len(bytes_imagem) > TAMANHO_MAXIMO:
        raise HTTPException(status_code=400, detail="A imagem deve ter até 4 MB.")

    nome_arquivo = f"{uuid4().hex}{extensao}"
    db.add(ImagemProduto(
        nome_arquivo=nome_arquivo,
        tipo_conteudo=TIPOS_PERMITIDOS[extensao],
        conteudo=bytes_imagem
    ))
    return f"{PREFIXO_URL}{nome_arquivo}"


def remover_imagem_por_url(imagem_url, db: Session):
    if not imagem_url or not imagem_url.startswith(PREFIXO_URL):
        return
    nome_arquivo = imagem_url.removeprefix(PREFIXO_URL)
    db.query(ImagemProduto).filter(ImagemProduto.nome_arquivo == nome_arquivo).delete(
        synchronize_session=False
    )
