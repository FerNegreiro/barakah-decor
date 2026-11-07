from typing import Optional

from pydantic import BaseModel, Field


class ProdutoCreate(BaseModel):
    nome: str
    categoria: str
    quantidade: int = Field(ge=0)
    preco: float = Field(ge=0)
    estoque_minimo: Optional[int] = Field(default=None, ge=1)
    imagem_url: Optional[str] = None


class ProdutoImagem(BaseModel):
    nome_arquivo: str
    conteudo: str


class LoginCreate(BaseModel):
    email: str
    senha: str
    lembrar: bool = True


class EntradaEstoque(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0)


class FornecedorCreate(BaseModel):
    nome: str
    telefone: str
    email: str
    cidade: str
    responsavel: str


class FinanceiroCreate(BaseModel):
    tipo: str
    descricao: str
    valor: float = Field(ge=0)


class CategoriaCreate(BaseModel):
    nome: str


class CompraCreate(BaseModel):
    produto_id: int
    fornecedor_id: int
    quantidade: int = Field(gt=0)
    valor: float = Field(ge=0)


class ZerarDados(BaseModel):
    confirmar: str
    senha: str


class AlterarSenha(BaseModel):
    senha_atual: str
    nova_senha: str = Field(min_length=8)


class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=1)
    email: str = Field(min_length=3)
    perfil: str = "Operador"
    senha: str = Field(min_length=8)


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    perfil: Optional[str] = None
    status: Optional[str] = None


class RedefinirSenha(BaseModel):
    nova_senha: str = Field(min_length=8)


class ConfiguracoesUpdate(BaseModel):
    empresa: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    cidade: Optional[str] = None
    whatsapp: Optional[str] = None
    estoque_minimo_padrao: Optional[int] = Field(default=None, ge=1)
    percentual_critico: Optional[int] = Field(default=None, ge=1, le=99)
