from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from models import Financeiro, Movimentacao, Produto
from services.configuracoes import obter_regras_estoque


def normalizar_data(valor):
    if isinstance(valor, datetime):
        return valor
    if isinstance(valor, date):
        return datetime.combine(valor, time.min)
    if isinstance(valor, str):
        for formato in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(valor, formato)
            except ValueError:
                pass
    return None


def formatar_data(data_hora):
    data_hora = normalizar_data(data_hora)
    if not data_hora:
        return ""
    return data_hora.strftime("%d/%m/%Y %H:%M")


def label_dia(data_hora):
    data_hora = normalizar_data(data_hora)
    return data_hora.strftime("%d/%m") if data_hora else ""


def formatar_moeda(valor):
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def calcular_valor_estoque_produto(produto):
    quantidade = produto.quantidade or 0
    preco_unitario = produto.preco or 0
    return quantidade * preco_unitario


def calcular_valor_total_estoque(produtos):
    return sum(calcular_valor_estoque_produto(produto) for produto in produtos)


REGRAS_PADRAO = {"estoque_minimo_padrao": 30, "percentual_critico": 66}
ORDEM_STATUS = {"Sem estoque": 0, "Crítico": 1, "Atenção": 2}


def estoque_minimo_produto(produto, regras=None):
    regras = regras or REGRAS_PADRAO
    return produto.estoque_minimo or regras["estoque_minimo_padrao"]


def produto_em_alerta(produto, regras=None):
    return (produto.quantidade or 0) <= estoque_minimo_produto(produto, regras)


def montar_alerta_estoque(produto, regras=None):
    regras = regras or REGRAS_PADRAO
    minimo = estoque_minimo_produto(produto, regras)
    quantidade = produto.quantidade or 0
    preco = produto.preco or 0
    percentual = min(round((quantidade / minimo) * 100), 100) if minimo else 0
    limite_critico = max(1, round(minimo * regras["percentual_critico"] / 100)) if minimo else 0

    if quantidade <= 0:
        status = "Sem estoque"
        prioridade = "Alta"
    elif quantidade <= limite_critico:
        status = "Crítico"
        prioridade = "Alta"
    else:
        status = "Atenção"
        prioridade = "Média"

    return {
        "id": produto.id,
        "nome": produto.nome,
        "categoria": produto.categoria,
        "imagem_url": produto.imagem_url,
        "quantidade": quantidade,
        "minimo": minimo,
        "limite_critico": limite_critico,
        "preco": preco,
        "valor_total": round(calcular_valor_estoque_produto(produto), 2),
        "reposicao_sugerida": max(minimo - quantidade, 0),
        "nivel_percentual": percentual,
        "status": status,
        "critical": status != "Atenção",
        "prioridade": prioridade,
    }


def listar_alertas_estoque(produtos, regras=None):
    alertas = [
        montar_alerta_estoque(produto, regras)
        for produto in produtos
        if produto_em_alerta(produto, regras)
    ]
    return sorted(alertas, key=lambda item: (ORDEM_STATUS[item["status"]], item["nivel_percentual"], item["nome"] or ""))


def label_semana(data_hora):
    inicio = data_hora.date() - timedelta(days=data_hora.weekday())
    fim = inicio + timedelta(days=6)
    return f"{inicio.strftime('%d/%m')} a {fim.strftime('%d/%m')}"


def adicionar_resumo_movimento(resumos, chave, rotulo, quantidade_entrada, quantidade_saida, valor_saida):
    if chave not in resumos:
        resumos[chave] = {
            "periodo": rotulo,
            "entradas": 0,
            "saidas": 0,
            "valor_vendido": 0,
            "saldo": 0,
        }

    resumos[chave]["entradas"] += quantidade_entrada
    resumos[chave]["saidas"] += quantidade_saida
    resumos[chave]["valor_vendido"] += valor_saida
    resumos[chave]["saldo"] = resumos[chave]["entradas"] - resumos[chave]["saidas"]


def montar_dados_relatorio(db: Session):
    regras = obter_regras_estoque(db)
    produtos = db.query(Produto).all()
    movimentacoes = db.query(Movimentacao).all()
    lancamentos = db.query(Financeiro).all()

    produtos_por_id = {produto.id: produto for produto in produtos}
    valor_total = calcular_valor_total_estoque(produtos)
    total_itens = sum(produto.quantidade or 0 for produto in produtos)
    alertas_estoque = listar_alertas_estoque(produtos, regras)
    status_por_produto = {alerta["id"]: alerta["status"] for alerta in alertas_estoque}

    vendas_por_produto = {}
    total_vendido = 0
    faturamento_vendas = 0
    for movimento in movimentacoes:
        if movimento.tipo != "saida":
            continue

        produto = produtos_por_id.get(movimento.produto_id)
        nome = produto.nome if produto else movimento.produto_nome or "Produto removido"
        categoria = produto.categoria if produto else "Sem categoria"
        imagem_url = produto.imagem_url if produto else None
        estoque_atual = produto.quantidade if produto else 0
        chave = movimento.produto_id or nome

        if chave not in vendas_por_produto:
            vendas_por_produto[chave] = {
                "nome": nome,
                "categoria": categoria,
                "imagem_url": imagem_url,
                "quantidade": 0,
                "faturamento": 0,
                "estoque_atual": estoque_atual,
            }

        quantidade = movimento.quantidade or 0
        faturamento = movimento.valor_total or 0
        vendas_por_produto[chave]["quantidade"] += quantidade
        vendas_por_produto[chave]["faturamento"] += faturamento
        vendas_por_produto[chave]["estoque_atual"] = estoque_atual
        total_vendido += quantidade
        faturamento_vendas += faturamento

    produtos_mais_vendidos = []
    for item in sorted(
        vendas_por_produto.values(),
        key=lambda produto: produto["quantidade"],
        reverse=True
    ):
        quantidade = item["quantidade"] or 0
        faturamento = item["faturamento"] or 0
        produtos_mais_vendidos.append({
            **item,
            "ticket_medio": round(faturamento / quantidade, 2) if quantidade else 0,
            "participacao": round((quantidade / total_vendido) * 100, 1) if total_vendido else 0,
        })

    estoque_por_categoria = {}
    for produto in produtos:
        categoria = produto.categoria or "Sem categoria"
        if categoria not in estoque_por_categoria:
            estoque_por_categoria[categoria] = {
                "categoria": categoria,
                "produtos": 0,
                "quantidade": 0,
                "valor": 0,
            }

        estoque_por_categoria[categoria]["produtos"] += 1
        estoque_por_categoria[categoria]["quantidade"] += produto.quantidade or 0
        estoque_por_categoria[categoria]["valor"] += calcular_valor_estoque_produto(produto)

    receitas = sum(item.valor or 0 for item in lancamentos if item.tipo == "Receita")
    despesas = sum(item.valor or 0 for item in lancamentos if item.tipo == "Despesa")
    lucro = receitas - despesas

    financeiro_por_dia = {}
    for lancamento in lancamentos:
        data_lancamento = normalizar_data(lancamento.data) or datetime.now()
        chave = data_lancamento.strftime("%d/%m/%Y")
        if chave not in financeiro_por_dia:
            financeiro_por_dia[chave] = {
                "data": chave,
                "receitas": 0,
                "despesas": 0,
                "resultado": 0,
            }
        if lancamento.tipo == "Receita":
            financeiro_por_dia[chave]["receitas"] += lancamento.valor or 0
        elif lancamento.tipo == "Despesa":
            financeiro_por_dia[chave]["despesas"] += lancamento.valor or 0
        financeiro_por_dia[chave]["resultado"] = (
            financeiro_por_dia[chave]["receitas"] - financeiro_por_dia[chave]["despesas"]
        )

    entradas = []
    saidas = []
    movimentacoes_detalhadas = []
    resumo_diario = {}
    resumo_semanal = {}
    resumo_mensal = {}

    for movimento in sorted(
        movimentacoes,
        key=lambda item: normalizar_data(item.data) or datetime.min,
        reverse=True
    ):
        data_movimento = normalizar_data(movimento.data) or datetime.now()
        produto = produtos_por_id.get(movimento.produto_id)
        nome = produto.nome if produto else movimento.produto_nome or "Produto removido"
        categoria = produto.categoria if produto else "Sem categoria"
        quantidade = movimento.quantidade or 0
        valor = round(movimento.valor_total or 0, 2)
        tipo = "Entrada" if movimento.tipo == "entrada" else "Saída"
        detalhe = {
            "data": data_movimento,
            "data_formatada": formatar_data(data_movimento),
            "tipo": tipo,
            "titulo": movimento.titulo or tipo,
            "produto": nome,
            "categoria": categoria,
            "quantidade": quantidade,
            "valor": valor,
            "descricao": movimento.descricao or f"{nome} - {quantidade} unidades",
        }
        movimentacoes_detalhadas.append(detalhe)

        quantidade_entrada = quantidade if movimento.tipo == "entrada" else 0
        quantidade_saida = quantidade if movimento.tipo == "saida" else 0
        valor_saida = valor if movimento.tipo == "saida" else 0

        adicionar_resumo_movimento(
            resumo_diario,
            data_movimento.strftime("%Y-%m-%d"),
            data_movimento.strftime("%d/%m/%Y"),
            quantidade_entrada,
            quantidade_saida,
            valor_saida
        )
        adicionar_resumo_movimento(
            resumo_semanal,
            f"{data_movimento.isocalendar().year}-{data_movimento.isocalendar().week:02d}",
            label_semana(data_movimento),
            quantidade_entrada,
            quantidade_saida,
            valor_saida
        )
        adicionar_resumo_movimento(
            resumo_mensal,
            data_movimento.strftime("%Y-%m"),
            data_movimento.strftime("%m/%Y"),
            quantidade_entrada,
            quantidade_saida,
            valor_saida
        )

        if movimento.tipo == "entrada":
            entradas.append(detalhe)
        elif movimento.tipo == "saida":
            saidas.append(detalhe)

    return {
        "total_produtos": len(produtos),
        "total_itens": total_itens,
        "valor_total": round(valor_total, 2),
        "estoque_baixo": len(alertas_estoque),
        "sem_estoque": len([produto for produto in produtos if (produto.quantidade or 0) <= 0]),
        "total_vendido": total_vendido,
        "faturamento_vendas": round(faturamento_vendas, 2),
        "produtos": produtos,
        "produtos_estoque_baixo": alertas_estoque,
        "produtos_mais_vendidos": produtos_mais_vendidos,
        "estoque_por_categoria": [
            {
                **item,
                "valor": round(item["valor"], 2),
            }
            for item in sorted(
                estoque_por_categoria.values(),
                key=lambda categoria: categoria["valor"],
                reverse=True
            )
        ],
        "produtos_detalhados": [
            {
                "id": produto.id,
                "nome": produto.nome,
                "categoria": produto.categoria or "Sem categoria",
                "imagem_url": produto.imagem_url,
                "quantidade": produto.quantidade or 0,
                "preco": round(produto.preco or 0, 2),
                "estoque_minimo": estoque_minimo_produto(produto, regras),
                "valor_total": round(calcular_valor_estoque_produto(produto), 2),
                "status": status_por_produto.get(produto.id, "OK"),
            }
            for produto in produtos
        ],
        "entradas": entradas,
        "saidas": saidas,
        "movimentacoes": movimentacoes_detalhadas,
        "resumo_movimentos": {
            "diario": [resumo_diario[chave] for chave in sorted(resumo_diario)],
            "semanal": [resumo_semanal[chave] for chave in sorted(resumo_semanal)],
            "mensal": [resumo_mensal[chave] for chave in sorted(resumo_mensal)],
        },
        "financeiro": {
            "receitas": round(receitas, 2),
            "despesas": round(despesas, 2),
            "lucro": round(lucro, 2),
            "margem": round((lucro / receitas) * 100, 1) if receitas else 0,
            "lancamentos": len(lancamentos),
            "por_dia": sorted(
                financeiro_por_dia.values(),
                key=lambda item: datetime.strptime(item["data"], "%d/%m/%Y")
            ),
        },
    }
