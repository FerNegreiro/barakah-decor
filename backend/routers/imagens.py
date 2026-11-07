import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from database import get_db
from models import ImagemProduto

router = APIRouter(tags=["Imagens"])

PASTA_LEGADA = Path(__file__).resolve().parent.parent / "uploads" / "produtos"
NOME_VALIDO = re.compile(r"^[A-Za-z0-9_-]+\.(png|jpg|jpeg|webp)$")


@router.get("/uploads/produtos/{nome_arquivo}")
def obter_imagem_produto(nome_arquivo: str, db: Session = Depends(get_db)):
    if not NOME_VALIDO.match(nome_arquivo):
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    imagem = db.query(ImagemProduto).filter(ImagemProduto.nome_arquivo == nome_arquivo).first()
    if imagem:
        return Response(
            content=imagem.conteudo,
            media_type=imagem.tipo_conteudo,
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )

    caminho_legado = PASTA_LEGADA / nome_arquivo
    if caminho_legado.is_file():
        return FileResponse(caminho_legado)

    raise HTTPException(status_code=404, detail="Imagem não encontrada")
