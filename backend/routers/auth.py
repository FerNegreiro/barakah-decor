import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import Sessao, Usuario
from schemas import AlterarSenha, LoginCreate
from services.limite_login import (
    MAX_TENTATIVAS_EMAIL,
    MAX_TENTATIVAS_IP,
    ip_da_requisicao,
    limpar_tentativas,
    registrar_falha,
    segundos_bloqueado,
)
from security import conferir_senha, extrair_token, gerar_hash_senha, get_usuario_atual

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login")
def login(dados: LoginCreate, request: Request, db: Session = Depends(get_db)):
    email = dados.email.strip().lower()
    chaves = {
        f"email:{email}": MAX_TENTATIVAS_EMAIL,
        f"ip:{ip_da_requisicao(request)}": MAX_TENTATIVAS_IP,
    }

    espera = max(segundos_bloqueado(chave, limite) for chave, limite in chaves.items())
    if espera:
        minutos = max(1, round(espera / 60))
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas de login. Tente novamente em {minutos} minuto(s)."
        )

    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if (
        not usuario
        or usuario.status != "Ativo"
        or not conferir_senha(dados.senha, usuario.senha_hash)
    ):
        for chave in chaves:
            registrar_falha(chave)
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    limpar_tentativas(f"email:{email}")

    db.query(Sessao).filter(Sessao.expira_em < datetime.now()).delete(synchronize_session=False)

    validade = timedelta(days=30 if dados.lembrar else 1)
    token = secrets.token_urlsafe(48)
    db.add(Sessao(
        usuario_id=usuario.id,
        token=token,
        expira_em=datetime.now() + validade
    ))
    db.commit()

    return {
        "token": token,
        "usuario": {
            "nome": usuario.nome,
            "email": usuario.email,
            "cargo": usuario.perfil,
        }
    }


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    token = extrair_token(request)
    if token:
        db.query(Sessao).filter(Sessao.token == token).delete(synchronize_session=False)
        db.commit()
    return {"mensagem": "Sessão encerrada"}


@router.get("/me")
def auth_me(usuario: Usuario = Depends(get_usuario_atual)):
    return {
        "nome": usuario.nome,
        "email": usuario.email,
        "cargo": usuario.perfil,
    }


@router.post("/alterar-senha")
def alterar_senha(
    dados: AlterarSenha,
    request: Request,
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db)
):
    if not conferir_senha(dados.senha_atual, usuario.senha_hash):
        raise HTTPException(status_code=400, detail="A senha atual está incorreta.")

    usuario.senha_hash = gerar_hash_senha(dados.nova_senha)
    db.query(Sessao).filter(
        Sessao.usuario_id == usuario.id,
        Sessao.token != extrair_token(request)
    ).delete(synchronize_session=False)
    db.commit()

    return {"mensagem": "Senha alterada com sucesso."}
