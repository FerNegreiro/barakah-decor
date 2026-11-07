from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Produto
from schemas import ProdutoCreate, ProdutoImagem
from services.configuracoes import obter_regras_estoque
from services.imagens import remover_imagem_por_url, salvar_imagem_produto

router = APIRouter(prefix="/produtos", tags=["Produtos"])


def buscar_produto(produto_id: int, db: Session):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.get("")
def listar_produtos(db: Session = Depends(get_db)):
    return db.query(Produto).all()


@router.post("")
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    novo_produto = Produto(
        nome=produto.nome,
        categoria=produto.categoria,
        quantidade=produto.quantidade,
        preco=round(produto.preco, 2),
        estoque_minimo=produto.estoque_minimo or obter_regras_estoque(db)["estoque_minimo_padrao"],
        imagem_url=produto.imagem_url
    )

    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)

    return novo_produto


@router.put("/{produto_id}")
def atualizar_produto(produto_id: int, produto: ProdutoCreate, db: Session = Depends(get_db)):
    produto_db = buscar_produto(produto_id, db)

    produto_db.nome = produto.nome
    produto_db.categoria = produto.categoria
    produto_db.quantidade = produto.quantidade
    produto_db.preco = round(produto.preco, 2)
    produto_db.estoque_minimo = produto.estoque_minimo or obter_regras_estoque(db)["estoque_minimo_padrao"]
    if produto.imagem_url is not None:
        produto_db.imagem_url = produto.imagem_url

    db.commit()
    db.refresh(produto_db)

    return produto_db


@router.delete("/{produto_id}")
def deletar_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = buscar_produto(produto_id, db)

    remover_imagem_por_url(produto.imagem_url, db)
    db.delete(produto)
    db.commit()

    return {"mensagem": "Produto removido"}


@router.post("/{produto_id}/imagem")
def atualizar_imagem_produto(produto_id: int, imagem: ProdutoImagem, db: Session = Depends(get_db)):
    produto_db = buscar_produto(produto_id, db)

    nova_url = salvar_imagem_produto(imagem, db)
    remover_imagem_por_url(produto_db.imagem_url, db)
    produto_db.imagem_url = nova_url
    db.commit()
    db.refresh(produto_db)

    return produto_db


@router.delete("/{produto_id}/imagem")
def remover_imagem_produto(produto_id: int, db: Session = Depends(get_db)):
    produto_db = buscar_produto(produto_id, db)

    remover_imagem_por_url(produto_db.imagem_url, db)
    produto_db.imagem_url = None
    db.commit()
    db.refresh(produto_db)

    return produto_db
