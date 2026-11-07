from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, LargeBinary, Numeric, String

from database import Base

Dinheiro = Numeric(12, 2, asdecimal=False)


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    categoria = Column(String)
    quantidade = Column(Integer)
    preco = Column(Dinheiro)
    estoque_minimo = Column(Integer, default=30)
    imagem_url = Column(String)


class ImagemProduto(Base):
    __tablename__ = "imagens_produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome_arquivo = Column(String, unique=True, index=True)
    tipo_conteudo = Column(String)
    conteudo = Column(LargeBinary)
    criado_em = Column(DateTime, default=datetime.now)


class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    telefone = Column(String)
    email = Column(String)
    cidade = Column(String)
    responsavel = Column(String)


class Financeiro(Base):
    __tablename__ = "financeiro"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)
    descricao = Column(String)
    valor = Column(Dinheiro)
    data = Column(DateTime, default=datetime.now)


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)


class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer)
    fornecedor_id = Column(Integer)
    quantidade = Column(Integer)
    valor = Column(Dinheiro)


class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)
    titulo = Column(String)
    descricao = Column(String)
    produto_id = Column(Integer)
    produto_nome = Column(String)
    quantidade = Column(Integer)
    valor_total = Column(Dinheiro, default=0)
    data = Column(DateTime, default=datetime.now)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    perfil = Column(String, default="Administrador")
    status = Column(String, default="Ativo")
    criado_em = Column(DateTime, default=datetime.now)


class Sessao(Base):
    __tablename__ = "sessoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer)
    token = Column(String, unique=True, index=True)
    expira_em = Column(DateTime)
    criado_em = Column(DateTime, default=datetime.now)


class Configuracao(Base):
    __tablename__ = "configuracoes"

    chave = Column(String, primary_key=True)
    valor = Column(String)
