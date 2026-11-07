from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from schemas import ConfiguracoesUpdate
from security import exigir_admin
from services.configuracoes import obter_configuracoes, salvar_configuracoes

router = APIRouter(prefix="/configuracoes", tags=["Configurações"])


@router.get("")
def ler_configuracoes(db: Session = Depends(get_db)):
    return obter_configuracoes(db)


@router.put("")
def atualizar_configuracoes(
    dados: ConfiguracoesUpdate,
    admin: Usuario = Depends(exigir_admin),
    db: Session = Depends(get_db)
):
    valores = {chave: valor for chave, valor in dados.model_dump().items() if valor is not None}
    return salvar_configuracoes(db, valores)
