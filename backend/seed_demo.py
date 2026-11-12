import io
import os
import random
import shutil
import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from uuid import uuid4

from database import DATABASE_URL, IS_SQLITE, Base, SessionLocal, engine
from migrations import executar_migracoes
from models import (
    Categoria,
    Compra,
    Configuracao,
    Financeiro,
    Fornecedor,
    ImagemProduto,
    Movimentacao,
    Produto,
    Sessao,
    Usuario,
)
from security import gerar_hash_senha

ADMIN_EMAIL = "admin@demo.com"
ADMIN_SENHA = "demo1234"
DIAS_HISTORICO = 75

CATEGORIAS = ["Embalagens", "Fitas e Laços", "Festas", "Decoração", "Confeitaria", "Papelaria"]

PRODUTOS = [
    ("Caixa Kraft 20x20x10", "Embalagens", 6.90, 180, 40, "#b08150"),
    ("Sacola de Papel Kraft M (pct 10)", "Embalagens", 14.50, 95, 30, "#a8784a"),
    ("Saco Celofane 15x25 (pct 50)", "Embalagens", 9.90, 22, 30, "#7fb3c8"),
    ("Caixa MDF para Presente", "Embalagens", 24.90, 0, 15, "#c49a6c"),
    ("Caixa de Acetato para Trufa (pct 20)", "Embalagens", 18.00, 64, 25, "#9ec9d9"),
    ("Fita de Cetim 10mm Dourada (rolo)", "Fitas e Laços", 7.50, 140, 40, "#e6ae28"),
    ("Fita de Gorgurão 22mm Rosé (rolo)", "Fitas e Laços", 9.90, 12, 30, "#e7a1a8"),
    ("Laço Pronto Vermelho (pct 10)", "Fitas e Laços", 16.90, 48, 20, "#c8323c"),
    ("Balão Metalizado Coração 45cm", "Festas", 5.90, 210, 50, "#d94f70"),
    ("Balão Látex nº 9 Sortido (pct 50)", "Festas", 19.90, 8, 25, "#6c8fd9"),
    ("Toalha de Mesa TNT Branca", "Festas", 12.00, 37, 20, "#cfd6dd"),
    ("Pisca-Pisca LED 100 Lâmpadas", "Decoração", 34.90, 26, 15, "#f2c94c"),
    ("Vela Aromática Lavanda", "Decoração", 29.90, 54, 20, "#9b87c9"),
    ("Arranjo de Flores Artificiais", "Decoração", 79.90, 9, 10, "#6fa86b"),
    ("Vaso de Vidro Cilíndrico 20cm", "Decoração", 39.90, 0, 8, "#8fc1b5"),
    ("Cesta de Vime P", "Decoração", 44.90, 31, 10, "#b98c55"),
    ("Forminha para Doces nº 5 (pct 100)", "Confeitaria", 8.90, 260, 60, "#f0a35e"),
    ("Bandeja Dourada Redonda 30cm", "Confeitaria", 15.90, 18, 20, "#d4a72c"),
    ("Topo de Bolo Feliz Aniversário", "Confeitaria", 11.90, 73, 20, "#e46fa1"),
    ("Papel de Seda Branco (pct 20)", "Papelaria", 6.50, 120, 40, "#8fa3b5"),
    ("Tag Kraft Personalizável (pct 50)", "Papelaria", 13.90, 85, 30, "#9c7448"),
    ("Etiqueta Adesiva Kraft (rolo)", "Papelaria", 21.90, 5, 12, "#8a6a45"),
]

FORNECEDORES = [
    ("Distribuidora Nordeste Embalagens", "(85) 3200-1100", "vendas@nordesteembalagens.exemplo.com", "Fortaleza - CE", "Ricardo Lima"),
    ("Arte & Fita Atacado", "(85) 98800-2211", "pedidos@arteefita.exemplo.com", "Maracanaú - CE", "Juliana Costa"),
    ("Festa Fácil Importadora", "(11) 3300-4455", "comercial@festafacil.exemplo.com", "São Paulo - SP", "Marcos Pereira"),
    ("Casa & Brilho Decorações", "(81) 3444-7788", "contato@casaebrilho.exemplo.com", "Recife - PE", "Patrícia Moura"),
    ("Doce Forma Confeitaria Atacado", "(85) 99700-3344", "atendimento@doceforma.exemplo.com", "Caucaia - CE", "Eduardo Ramos"),
]

USUARIOS = [
    ("Camila Rocha", ADMIN_EMAIL, "Administrador", "Ativo"),
    ("Lucas Andrade", "lucas@demo.com", "Operador", "Ativo"),
    ("Beatriz Nogueira", "beatriz@demo.com", "Operador", "Ativo"),
    ("Thiago Martins", "thiago@demo.com", "Operador", "Bloqueado"),
]

DESPESAS_MENSAIS = [
    ("Aluguel da loja", 5, 2200.00),
    ("Folha de pagamento", 5, 3600.00),
    ("Energia elétrica", 10, 480.00),
    ("Internet e telefone", 12, 189.90),
    ("Contador", 15, 650.00),
    ("Anúncios no Instagram", 20, 400.00),
]

CONFIGURACOES = {
    "empresa": "Barakah Decor",
    "telefone": "(85) 3000-0000",
    "email": "contato@empresa.exemplo.com",
    "cidade": "Fortaleza - CE",
    "whatsapp": "(85) 90000-0000",
    "estoque_minimo_padrao": "30",
    "percentual_critico": "66",
}


def conferir_banco():
    if not IS_SQLITE:
        print("Este script só roda em banco SQLite local, para nunca apagar um banco de produção.")
        print(f"DATABASE_URL atual: {DATABASE_URL.split('@')[-1]}")
        sys.exit(1)

    caminho = DATABASE_URL.replace("sqlite:///", "", 1)
    arquivo = Path(caminho)
    if arquivo.exists() and arquivo.stat().st_size > 0:
        backup = arquivo.with_name(f"{arquivo.stem}_backup_{datetime.now():%Y%m%d_%H%M%S}{arquivo.suffix}")
        shutil.copy2(arquivo, backup)
        print(f"Backup do banco anterior salvo em {backup}")


def limpar_tabelas(db):
    for modelo in (Sessao, Movimentacao, Compra, Financeiro, ImagemProduto, Produto, Categoria, Fornecedor, Configuracao, Usuario):
        db.query(modelo).delete()
    db.commit()


def gerar_imagem(nome, cor):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return None

    tamanho = 256
    imagem = Image.new("RGB", (tamanho, tamanho), cor)
    desenho = ImageDraw.Draw(imagem)
    desenho.rectangle([0, tamanho * 0.62, tamanho, tamanho], fill=tuple(max(c - 35, 0) for c in imagem.getpixel((0, 0))))

    palavras = [palavra for palavra in nome.split() if len(palavra) > 2 and palavra[0].isalpha()]
    iniciais = "".join(palavra[0] for palavra in palavras[:2]).upper()
    try:
        fonte = ImageFont.truetype("DejaVuSans-Bold.ttf", 96)
    except OSError:
        try:
            fonte = ImageFont.truetype("arialbd.ttf", 96)
        except OSError:
            try:
                fonte = ImageFont.load_default(size=96)
            except TypeError:
                fonte = ImageFont.load_default()

    caixa = desenho.textbbox((0, 0), iniciais, font=fonte)
    largura, altura = caixa[2] - caixa[0], caixa[3] - caixa[1]
    desenho.text(((tamanho - largura) / 2 - caixa[0], (tamanho - altura) / 2 - caixa[1]), iniciais, fill="white", font=fonte)

    buffer = io.BytesIO()
    imagem.save(buffer, format="PNG")
    return buffer.getvalue()


def data_aleatoria(dia, inicio=9, fim=18):
    limite = fim
    if dia == date.today():
        limite = max(min(datetime.now().hour, fim), inicio + 1)
    hora = random.randint(inicio, limite - 1)
    return datetime.combine(dia, time(hora, random.randint(0, 59), random.randint(0, 59)))


def popular(db):
    random.seed(42)
    hoje = date.today()
    inicio = hoje - timedelta(days=DIAS_HISTORICO)

    for chave, valor in CONFIGURACOES.items():
        db.add(Configuracao(chave=chave, valor=valor))

    for nome, email, perfil, status in USUARIOS:
        db.add(Usuario(
            nome=nome,
            email=email,
            senha_hash=gerar_hash_senha(ADMIN_SENHA),
            perfil=perfil,
            status=status,
            criado_em=datetime.combine(inicio, time(10, 0)),
        ))

    for nome in CATEGORIAS:
        db.add(Categoria(nome=nome))

    fornecedores = []
    for nome, telefone, email, cidade, responsavel in FORNECEDORES:
        fornecedor = Fornecedor(nome=nome, telefone=telefone, email=email, cidade=cidade, responsavel=responsavel)
        db.add(fornecedor)
        fornecedores.append(fornecedor)

    produtos = []
    sem_imagem = False
    for nome, categoria, preco, quantidade, minimo, cor in PRODUTOS:
        imagem_url = None
        conteudo = gerar_imagem(nome, cor)
        if conteudo:
            arquivo = f"{uuid4().hex}.png"
            db.add(ImagemProduto(nome_arquivo=arquivo, tipo_conteudo="image/png", conteudo=conteudo))
            imagem_url = f"/uploads/produtos/{arquivo}"
        else:
            sem_imagem = True
        produto = Produto(
            nome=nome,
            categoria=categoria,
            preco=preco,
            quantidade=quantidade,
            estoque_minimo=minimo,
            imagem_url=imagem_url,
        )
        db.add(produto)
        produtos.append(produto)

    db.flush()

    pesos = [random.randint(2, 10) for _ in produtos]
    for indice in (0, 5, 8, 16, 19):
        pesos[indice] += 12

    dia = inicio
    while dia <= hoje:
        crescimento = 1 + (dia - inicio).days / DIAS_HISTORICO * 0.35
        vendas_no_dia = int(random.randint(11, 16) * crescimento)
        if dia.weekday() == 5:
            vendas_no_dia += 5
        if dia.weekday() == 6:
            vendas_no_dia = random.randint(5, 8)

        total_dia = 0
        for _ in range(vendas_no_dia):
            produto = random.choices(produtos, weights=pesos)[0]
            quantidade = random.choice([1, 1, 2, 2, 3, 4, 5, 6, 10])
            valor = round(quantidade * produto.preco, 2)
            total_dia += valor
            db.add(Movimentacao(
                tipo="saida",
                titulo="Venda Realizada",
                descricao=f"{produto.nome} - {quantidade} unidades",
                produto_id=produto.id,
                produto_nome=produto.nome,
                quantidade=quantidade,
                valor_total=valor,
                data=data_aleatoria(dia),
            ))

        if dia < hoje:
            db.add(Financeiro(
                tipo="Receita",
                descricao=f"Vendas do dia {dia:%d/%m}",
                valor=round(total_dia, 2),
                data=datetime.combine(dia, time(19, 0)),
            ))

        if dia.weekday() in (0, 3):
            produto = random.choice(produtos)
            quantidade = random.choice([20, 30, 40, 50])
            db.add(Movimentacao(
                tipo="entrada",
                titulo="Entrada de Estoque",
                descricao=f"{produto.nome} - {quantidade} unidades",
                produto_id=produto.id,
                produto_nome=produto.nome,
                quantidade=quantidade,
                valor_total=0,
                data=data_aleatoria(dia, 8, 10),
            ))

        if dia.weekday() == 1:
            produto = random.choice(produtos)
            fornecedor = random.choice(fornecedores)
            quantidade = random.choice([10, 15, 20]) if produto.preco > 20 else random.choice([40, 60, 80, 100])
            custo = round(quantidade * produto.preco * random.uniform(0.45, 0.6), 2)
            db.add(Compra(produto_id=produto.id, fornecedor_id=fornecedor.id, quantidade=quantidade, valor=custo))
            db.add(Movimentacao(
                tipo="entrada",
                titulo="Compra Registrada",
                descricao=f"{produto.nome} - {quantidade} unidades",
                produto_id=produto.id,
                produto_nome=produto.nome,
                quantidade=quantidade,
                valor_total=0,
                data=data_aleatoria(dia, 8, 11),
            ))
            db.add(Financeiro(
                tipo="Despesa",
                descricao=f"Compra - {fornecedor.nome}",
                valor=custo,
                data=datetime.combine(dia, time(11, 30)),
            ))

        for descricao, dia_vencimento, valor in DESPESAS_MENSAIS:
            if dia.day == dia_vencimento:
                db.add(Financeiro(
                    tipo="Despesa",
                    descricao=descricao,
                    valor=round(valor * random.uniform(0.95, 1.08), 2),
                    data=datetime.combine(dia, time(9, 0)),
                ))

        dia += timedelta(days=1)

    db.commit()
    return sem_imagem


def main():
    conferir_banco()
    Base.metadata.create_all(bind=engine)
    executar_migracoes()

    db = SessionLocal()
    try:
        limpar_tabelas(db)
        sem_imagem = popular(db)
    finally:
        db.close()

    print("Banco de demonstração pronto.")
    print(f"Login: {ADMIN_EMAIL}  |  Senha: {ADMIN_SENHA}")
    if sem_imagem:
        print("Fotos dos produtos não geradas. Para gerar, rode: pip install pillow e execute o script de novo.")


if __name__ == "__main__":
    main()
