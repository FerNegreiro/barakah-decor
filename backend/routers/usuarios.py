import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Sessao, Usuario
from schemas import RedefinirSenha, UsuarioCreate, UsuarioUpdate
from security import PERFIL_ADMIN, exigir_admin, gerar_hash_senha

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

PERFIS = {PERFIL_ADMIN, "Operador"}
STATUS = {"Ativo", "Pausado"}
EMAIL_VALIDO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def serializar(usuario: Usuario):
    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "email": usuario.email,
        "perfil": usuario.perfil,
        "status": usuario.status,
        "criado_em": usuario.criado_em,
    }


def buscar_usuario(usuario_id: int, db: Session):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


def total_admins_ativos(db: Session, ignorar_id=None):
    consulta = db.query(Usuario).filter(Usuario.perfil == PERFIL_ADMIN, Usuario.status == "Ativo")
    if ignorar_id is not None:
        consulta = consulta.filter(Usuario.id != ignorar_id)
    return consulta.count()


def encerrar_sessoes(usuario_id: int, db: Session):
    db.query(Sessao).filter(Sessao.usuario_id == usuario_id).delete(synchronize_session=False)


@router.get("")
def listar_usuarios(admin: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    return [serializar(usuario) for usuario in db.query(Usuario).order_by(Usuario.nome).all()]


@router.post("")
def criar_usuario(dados: UsuarioCreate, admin: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    email = dados.email.strip().lower()
    if not EMAIL_VALIDO.match(email):
        raise HTTPException(status_code=400, detail="Informe um e-mail válido.")
    if dados.perfil not in PERFIS:
        raise HTTPException(status_code=400, detail="Perfil inválido.")
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(status_code=400, detail="Já existe um usuário com esse e-mail.")

    usuario = Usuario(
        nome=dados.nome.strip(),
        email=email,
        senha_hash=gerar_hash_senha(dados.senha),
        perfil=dados.perfil,
        status="Ativo"
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return serializar(usuario)


@router.put("/{usuario_id}")
def atualizar_usuario(
    usuario_id: int,
    dados: UsuarioUpdate,
    admin: Usuario = Depends(exigir_admin),
    db: Session = Depends(get_db)
):
    usuario = buscar_usuario(usuario_id, db)

    if dados.perfil is not None and dados.perfil not in PERFIS:
        raise HTTPException(status_code=400, detail="Perfil inválido.")
    if dados.status is not None and dados.status not in STATUS:
        raise HTTPException(status_code=400, detail="Status inválido.")

    deixa_de_ser_admin_ativo = usuario.perfil == PERFIL_ADMIN and usuario.status == "Ativo" and (
        (dados.perfil is not None and dados.perfil != PERFIL_ADMIN)
        or (dados.status is not None and dados.status != "Ativo")
    )
    if deixa_de_ser_admin_ativo:
        if usuario.id == admin.id:
            raise HTTPException(status_code=400, detail="Você não pode remover o seu próprio acesso de administrador.")
        if total_admins_ativos(db, ignorar_id=usuario.id) == 0:
            raise HTTPException(status_code=400, detail="O sistema precisa ter pelo menos um administrador ativo.")

    if dados.nome is not None and dados.nome.strip():
        usuario.nome = dados.nome.strip()
    if dados.perfil is not None:
        usuario.perfil = dados.perfil
    if dados.status is not None:
        usuario.status = dados.status
        if dados.status != "Ativo":
            encerrar_sessoes(usuario.id, db)

    db.commit()
    db.refresh(usuario)
    return serializar(usuario)


@router.post("/{usuario_id}/redefinir-senha")
def redefinir_senha(
    usuario_id: int,
    dados: RedefinirSenha,
    admin: Usuario = Depends(exigir_admin),
    db: Session = Depends(get_db)
):
    usuario = buscar_usuario(usuario_id, db)
    if usuario.id == admin.id:
        raise HTTPException(status_code=400, detail="Para trocar a sua própria senha, use Configurações > Alterar senha.")

    usuario.senha_hash = gerar_hash_senha(dados.nova_senha)
    encerrar_sessoes(usuario.id, db)
    db.commit()
    return {"mensagem": "Senha redefinida. O usuário precisará entrar novamente."}


@router.delete("/{usuario_id}")
def excluir_usuario(usuario_id: int, admin: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    usuario = buscar_usuario(usuario_id, db)

    if usuario.id == admin.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir o seu próprio usuário.")
    if usuario.perfil == PERFIL_ADMIN and usuario.status == "Ativo" and total_admins_ativos(db, ignorar_id=usuario.id) == 0:
        raise HTTPException(status_code=400, detail="O sistema precisa ter pelo menos um administrador ativo.")

    encerrar_sessoes(usuario.id, db)
    db.delete(usuario)
    db.commit()
    return {"mensagem": "Usuário removido"}
