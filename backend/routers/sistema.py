from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Categoria, Compra, Financeiro, Fornecedor, ImagemProduto, Movimentacao, Produto, Usuario
from schemas import ZerarDados
from security import conferir_senha, exigir_admin

router = APIRouter(prefix="/sistema", tags=["Sistema"])


@router.post("/zerar-dados")
def zerar_dados_sistema(
    dados: ZerarDados,
    usuario: Usuario = Depends(exigir_admin),
    db: Session = Depends(get_db)
):
    if dados.confirmar != "ZERAR":
        raise HTTPException(status_code=400, detail="Confirmação inválida para zerar os dados.")

    if not conferir_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=403, detail="Senha incorreta.")

    for tabela in [Movimentacao, Compra, Financeiro, ImagemProduto, Produto, Fornecedor, Categoria]:
        db.query(tabela).delete(synchronize_session=False)

    db.commit()

    return {"mensagem": "Dados de teste removidos. O sistema está pronto para começar."}
