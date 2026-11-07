import logging

from sqlalchemy import text

from database import IS_SQLITE, engine

logger = logging.getLogger("barakah")

COLUNAS_DINHEIRO = [
    ("produtos", "preco"),
    ("financeiro", "valor"),
    ("compras", "valor"),
    ("movimentacoes", "valor_total"),
]


def migrar_sqlite():
    with engine.begin() as connection:
        product_columns = connection.execute(text("PRAGMA table_info(produtos)")).fetchall()
        product_column_names = {column[1] for column in product_columns}
        if "imagem_url" not in product_column_names:
            connection.execute(text("ALTER TABLE produtos ADD COLUMN imagem_url VARCHAR"))
        if "estoque_minimo" not in product_column_names:
            connection.execute(text("ALTER TABLE produtos ADD COLUMN estoque_minimo INTEGER DEFAULT 30"))
        connection.execute(text("UPDATE produtos SET estoque_minimo = 30 WHERE estoque_minimo IS NULL"))

        columns = connection.execute(text("PRAGMA table_info(financeiro)")).fetchall()
        column_names = {column[1] for column in columns}
        if "data" not in column_names:
            connection.execute(text("ALTER TABLE financeiro ADD COLUMN data DATETIME"))
        connection.execute(
            text("UPDATE financeiro SET data = CURRENT_TIMESTAMP WHERE data IS NULL")
        )
        connection.execute(text("""
            INSERT INTO movimentacoes (
                tipo,
                titulo,
                descricao,
                produto_id,
                produto_nome,
                quantidade,
                valor_total,
                data
            )
            SELECT
                'entrada',
                'Compra Registrada',
                COALESCE(produtos.nome, 'Produto removido') || ' - ' || compras.quantidade || ' unidades',
                compras.produto_id,
                COALESCE(produtos.nome, 'Produto removido'),
                compras.quantidade,
                0,
                CURRENT_TIMESTAMP
            FROM compras
            LEFT JOIN produtos ON produtos.id = compras.produto_id
            WHERE NOT EXISTS (
                SELECT 1
                FROM movimentacoes
                WHERE movimentacoes.titulo = 'Compra Registrada'
                  AND movimentacoes.produto_id = compras.produto_id
                  AND movimentacoes.quantidade = compras.quantidade
            )
        """))


def migrar_postgres():
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque_minimo INTEGER DEFAULT 30"))
        connection.execute(text("UPDATE produtos SET estoque_minimo = 30 WHERE estoque_minimo IS NULL"))

        for tabela, coluna in COLUNAS_DINHEIRO:
            tipo_atual = connection.execute(
                text(
                    "SELECT data_type FROM information_schema.columns "
                    "WHERE table_schema = current_schema() AND table_name = :tabela AND column_name = :coluna"
                ),
                {"tabela": tabela, "coluna": coluna}
            ).scalar()

            if tipo_atual and tipo_atual != "numeric":
                connection.execute(text(
                    f"ALTER TABLE {tabela} ALTER COLUMN {coluna} "
                    f"TYPE NUMERIC(12, 2) USING ROUND({coluna}::numeric, 2)"
                ))
                logger.info("Coluna %s.%s convertida para NUMERIC(12, 2).", tabela, coluna)


def executar_migracoes():
    try:
        if IS_SQLITE:
            migrar_sqlite()
        else:
            migrar_postgres()
    except Exception:
        logger.exception("Falha ao executar as migrações do banco.")
