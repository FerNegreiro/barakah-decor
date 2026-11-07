from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Compra, Fornecedor, Movimentacao, Produto
from schemas import CompraCreate, EntradaEstoque

router = APIRouter(tags=["Estoque"])


def buscar_produto(produto_id: int, db: Session):
    produto = db.query(Produto).filter(Produto.id == produto_id).with_for_update().first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto


@router.post("/entradas")
def entrada_estoque(entrada: EntradaEstoque, db: Session = Depends(get_db)):
    produto = buscar_produto(entrada.produto_id, db)

    produto.quantidade = (produto.quantidade or 0) + entrada.quantidade
    db.add(Movimentacao(
        tipo="entrada",
        titulo="Entrada de Estoque",
        descricao=f"{produto.nome} - {entrada.quantidade} unidades",
        produto_id=produto.id,
        produto_nome=produto.nome,
        quantidade=entrada.quantidade,
        valor_total=0
    ))
    db.commit()
    db.refresh(produto)

    return {
        "mensagem": "Entrada registrada",
        "produto": produto.nome,
        "novo_estoque": produto.quantidade
    }


@router.post("/saidas")
def saida_estoque(saida: EntradaEstoque, db: Session = Depends(get_db)):
    produto = buscar_produto(saida.produto_id, db)

    if (produto.quantidade or 0) < saida.quantidade:
        raise HTTPException(
            status_code=400,
            detail=f"Estoque insuficiente. Disponível: {produto.quantidade or 0} unidades."
        )

    produto.quantidade -= saida.quantidade
    valor_total = round(saida.quantidade * (produto.preco or 0), 2)
    db.add(Movimentacao(
        tipo="saida",
        titulo="Venda Realizada",
        descricao=f"{produto.nome} - {saida.quantidade} unidades",
        produto_id=produto.id,
        produto_nome=produto.nome,
        quantidade=saida.quantidade,
        valor_total=valor_total
    ))
    db.commit()
    db.refresh(produto)

    return {
        "mensagem": "Saída registrada",
        "produto": produto.nome,
        "novo_estoque": produto.quantidade,
        "valor_total": valor_total
    }


@router.get("/compras")
def listar_compras(db: Session = Depends(get_db)):
    return db.query(Compra).all()


@router.post("/compras")
def criar_compra(compra: CompraCreate, db: Session = Depends(get_db)):
    produto = buscar_produto(compra.produto_id, db)

    if not db.query(Fornecedor).filter(Fornecedor.id == compra.fornecedor_id).first():
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    produto.quantidade = (produto.quantidade or 0) + compra.quantidade
    nova_compra = Compra(
        produto_id=compra.produto_id,
        fornecedor_id=compra.fornecedor_id,
        quantidade=compra.quantidade,
        valor=round(compra.valor, 2)
    )
    db.add(nova_compra)
    db.add(Movimentacao(
        tipo="entrada",
        titulo="Compra Registrada",
        descricao=f"{produto.nome} - {compra.quantidade} unidades",
        produto_id=produto.id,
        produto_nome=produto.nome,
        quantidade=compra.quantidade,
        valor_total=0
    ))
    db.commit()
    db.refresh(nova_compra)

    return nova_compra
