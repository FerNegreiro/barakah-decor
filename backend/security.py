import hashlib
import hmac
import logging
import os
import secrets
from datetime import datetime

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Sessao, Usuario

logger = logging.getLogger("barakah")

PASSWORD_ITERATIONS = 180_000
PERFIL_ADMIN = "Administrador"


def gerar_hash_senha(senha, salt=None):
    salt_bytes = salt or secrets.token_bytes(16)
    senha_hash = hashlib.pbkdf2_hmac(
        "sha256",
        senha.encode("utf-8"),
        salt_bytes,
        PASSWORD_ITERATIONS
    )
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${salt_bytes.hex()}${senha_hash.hex()}"


def conferir_senha(senha, senha_hash_salva):
    try:
        algoritmo, iteracoes, salt_hex, hash_hex = senha_hash_salva.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        senha_hash = hashlib.pbkdf2_hmac(
            "sha256",
            senha.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iteracoes)
        ).hex()
        return hmac.compare_digest(senha_hash, hash_hex)
    except Exception:
        return False


def criar_usuario_admin():
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    senha = os.getenv("ADMIN_PASSWORD", "")
    nome = os.getenv("ADMIN_NAME", "Administrador").strip()

    db = SessionLocal()
    try:
        if not email or not senha:
            if db.query(Usuario).count() == 0:
                logger.warning(
                    "Nenhum usuário cadastrado. Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o administrador."
                )
            return

        if db.query(Usuario).filter(Usuario.email == email).first():
            return

        db.add(Usuario(
            nome=nome,
            email=email,
            senha_hash=gerar_hash_senha(senha),
            perfil=PERFIL_ADMIN,
            status="Ativo"
        ))
        db.commit()
        logger.info("Usuário administrador criado para %s.", email)
    finally:
        db.close()


def extrair_token(request: Request):
    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip()
    return None


def buscar_usuario_por_token(token, db: Session):
    if not token:
        return None

    sessao = db.query(Sessao).filter(Sessao.token == token).first()
    if not sessao or not sessao.expira_em or sessao.expira_em < datetime.now():
        return None

    usuario = db.query(Usuario).filter(Usuario.id == sessao.usuario_id).first()
    if not usuario or usuario.status != "Ativo":
        return None

    return usuario


def get_usuario_atual(request: Request, db: Session = Depends(get_db)):
    usuario = buscar_usuario_por_token(extrair_token(request), db)
    if not usuario:
        raise HTTPException(status_code=401, detail="Acesso não autorizado")
    return usuario


def exigir_admin(usuario: Usuario = Depends(get_usuario_atual)):
    if usuario.perfil != PERFIL_ADMIN:
        raise HTTPException(status_code=403, detail="Apenas administradores podem fazer isso.")
    return usuario
