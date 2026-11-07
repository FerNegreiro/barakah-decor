import logging
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from migrations import executar_migracoes
from routers import (
    alertas,
    auth,
    cadastros,
    configuracoes,
    dashboard,
    estoque,
    imagens,
    produtos,
    relatorios,
    sistema,
    usuarios,
)
from security import criar_usuario_admin, get_usuario_atual

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)
executar_migracoes()
criar_usuario_admin()

app = FastAPI(title="Barakah Decor API")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.get("/")
def home():
    return {
        "empresa": "Barakah Decor",
        "status": "online"
    }


protegido = [Depends(get_usuario_atual)]

app.include_router(auth.router)
app.include_router(imagens.router)
app.include_router(produtos.router, dependencies=protegido)
app.include_router(estoque.router, dependencies=protegido)
app.include_router(cadastros.router, dependencies=protegido)
app.include_router(dashboard.router, dependencies=protegido)
app.include_router(relatorios.router, dependencies=protegido)
app.include_router(sistema.router, dependencies=protegido)
app.include_router(alertas.router, dependencies=protegido)
app.include_router(configuracoes.router, dependencies=protegido)
app.include_router(usuarios.router, dependencies=protegido)
