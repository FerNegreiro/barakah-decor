from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Categoria, Financeiro, Fornecedor
from schemas import CategoriaCreate, FinanceiroCreate, FornecedorCreate

router = APIRouter(tags=["Cadastros"])


def remover_registro(modelo, registro_id: int, mensagem_404: str, db: Session):
    registro = db.query(modelo).filter(modelo.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail=mensagem_404)
    db.delete(registro)
    db.commit()


@router.get("/fornecedores", tags=["Fornecedores"])
def listar_fornecedores(db: Session = Depends(get_db)):
    return db.query(Fornecedor).all()


@router.post("/fornecedores", tags=["Fornecedores"])
def criar_fornecedor(fornecedor: FornecedorCreate, db: Session = Depends(get_db)):
    novo_fornecedor = Fornecedor(**fornecedor.model_dump())
    db.add(novo_fornecedor)
    db.commit()
    db.refresh(novo_fornecedor)
    return novo_fornecedor


@router.delete("/fornecedores/{fornecedor_id}", tags=["Fornecedores"])
def deletar_fornecedor(fornecedor_id: int, db: Session = Depends(get_db)):
    remover_registro(Fornecedor, fornecedor_id, "Fornecedor não encontrado", db)
    return {"mensagem": "Fornecedor removido"}


@router.get("/categorias", tags=["Categorias"])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).all()


@router.post("/categorias", tags=["Categorias"])
def criar_categoria(categoria: CategoriaCreate, db: Session = Depends(get_db)):
    nome = categoria.nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Informe o nome da categoria.")

    nova_categoria = Categoria(nome=nome)
    db.add(nova_categoria)
    db.commit()
    db.refresh(nova_categoria)
    return nova_categoria


@router.delete("/categorias/{categoria_id}", tags=["Categorias"])
def excluir_categoria(categoria_id: int, db: Session = Depends(get_db)):
    remover_registro(Categoria, categoria_id, "Categoria não encontrada", db)
    return {"mensagem": "Categoria removida"}


@router.get("/financeiro", tags=["Financeiro"])
def listar_financeiro(db: Session = Depends(get_db)):
    return db.query(Financeiro).all()


@router.post("/financeiro", tags=["Financeiro"])
def criar_lancamento(financeiro: FinanceiroCreate, db: Session = Depends(get_db)):
    novo = Financeiro(
        tipo=financeiro.tipo,
        descricao=financeiro.descricao,
        valor=round(financeiro.valor, 2)
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.delete("/financeiro/{financeiro_id}", tags=["Financeiro"])
def excluir_lancamento(financeiro_id: int, db: Session = Depends(get_db)):
    remover_registro(Financeiro, financeiro_id, "Lançamento não encontrado", db)
    return {"mensagem": "Lançamento removido"}
