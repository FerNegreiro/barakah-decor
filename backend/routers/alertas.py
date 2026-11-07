from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Produto
from services.configuracoes import obter_regras_estoque
from services.relatorios import listar_alertas_estoque

router = APIRouter(prefix="/alertas", tags=["Alertas"])


def calcular_alertas(db: Session):
    produtos = db.query(Produto).all()
    alertas = listar_alertas_estoque(produtos, obter_regras_estoque(db))
    return {
        "total": len(alertas),
        "sem_estoque": sum(1 for alerta in alertas if alerta["status"] == "Sem estoque"),
        "criticos": sum(1 for alerta in alertas if alerta["status"] == "Crítico"),
        "atencao": sum(1 for alerta in alertas if alerta["status"] == "Atenção"),
        "produtos": alertas,
    }


@router.get("")
def listar_alertas(db: Session = Depends(get_db)):
    return calcular_alertas(db)


@router.get("/resumo")
def resumo_alertas(db: Session = Depends(get_db)):
    dados = calcular_alertas(db)
    dados.pop("produtos")
    return dados
