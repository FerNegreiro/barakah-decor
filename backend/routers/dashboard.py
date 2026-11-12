from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Compra, Financeiro, Movimentacao, Produto, Usuario
from security import get_usuario_atual
from services.configuracoes import obter_regras_estoque
from services.relatorios import (
    calcular_valor_total_estoque,
    formatar_data,
    listar_alertas_estoque,
    normalizar_data,
)

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard")
def dashboard(
    periodo_vendas: int = 7,
    filtro_produtos: str = "este_mes",
    filtro_financeiro: str = "este_mes",
    usuario: Usuario = Depends(get_usuario_atual),
    db: Session = Depends(get_db)
):

    produtos = db.query(Produto).all()
    movimentacoes_db = db.query(Movimentacao).order_by(
        Movimentacao.data.desc()
    ).all()
    compras = db.query(Compra).all()
    lancamentos = db.query(Financeiro).all()

    hoje = date.today()
    inicio_hoje = datetime.combine(hoje, time.min)
    fim_hoje = datetime.combine(hoje, time.max)
    ontem = hoje - timedelta(days=1)
    inicio_ontem = datetime.combine(ontem, time.min)
    fim_ontem = datetime.combine(ontem, time.max)
    inicio_periodo = inicio_hoje - timedelta(days=max(periodo_vendas, 1) - 1)
    inicio_mes = datetime.combine(hoje.replace(day=1), time.min)
    fim_mes_anterior = inicio_mes - timedelta(microseconds=1)
    inicio_mes_anterior = datetime.combine(fim_mes_anterior.date().replace(day=1), time.min)
    dia_limite_comparacao = min(hoje.day, fim_mes_anterior.day)
    fim_comparacao_mes = datetime.combine(
        fim_mes_anterior.date().replace(day=dia_limite_comparacao),
        time.max
    )

    def intervalo_por_filtro(filtro):
        if filtro == "mes_passado":
            return inicio_mes_anterior, fim_mes_anterior
        if filtro == "tudo":
            return None, None
        return inicio_mes, fim_hoje

    inicio_produtos, fim_produtos = intervalo_por_filtro(filtro_produtos)
    inicio_financeiro, fim_financeiro = intervalo_por_filtro(filtro_financeiro)

    def dentro_do_intervalo(data_hora, inicio, fim):
        data_hora = normalizar_data(data_hora)
        if not data_hora:
            return False
        if inicio and data_hora < inicio:
            return False
        if fim and data_hora > fim:
            return False
        return True

    total_produtos = len(produtos)
    total_itens = sum(produto.quantidade or 0 for produto in produtos)
    valor_estoque = calcular_valor_total_estoque(produtos)

    produtos_estoque_baixo = listar_alertas_estoque(produtos, obter_regras_estoque(db))

    produtos_por_id = {produto.id: produto for produto in produtos}
    movimentacoes = list(movimentacoes_db)
    chaves_movimentacoes = {
        (movimento.titulo, movimento.produto_id, movimento.quantidade)
        for movimento in movimentacoes_db
    }

    for compra in compras:
        chave = ("Compra Registrada", compra.produto_id, compra.quantidade)
        if chave in chaves_movimentacoes:
            continue

        produto_compra = produtos_por_id.get(compra.produto_id)
        nome_produto = produto_compra.nome if produto_compra else f"Produto #{compra.produto_id}"
        movimentacoes.append(
            Movimentacao(
                id=f"compra-{compra.id}",
                tipo="entrada",
                titulo="Compra Registrada",
                descricao=f"{nome_produto} - {compra.quantidade} unidades",
                produto_id=compra.produto_id,
                produto_nome=nome_produto,
                quantidade=compra.quantidade,
                valor_total=0,
                data=datetime.now()
            )
        )

    movimentacoes = sorted(
        movimentacoes,
        key=lambda movimento: normalizar_data(movimento.data) or datetime.min,
        reverse=True
    )

    saidas = [
        movimento
        for movimento in movimentacoes
        if movimento.tipo == "saida"
    ]

    saidas_periodo = [
        movimento
        for movimento in saidas
        if normalizar_data(movimento.data)
        and inicio_periodo <= normalizar_data(movimento.data) <= fim_hoje
    ]

    vendas_dia = sum(
        movimento.valor_total or 0
        for movimento in saidas
        if normalizar_data(movimento.data)
        and inicio_hoje <= normalizar_data(movimento.data) <= fim_hoje
    )

    vendas_ontem = sum(
        movimento.valor_total or 0
        for movimento in saidas
        if normalizar_data(movimento.data)
        and inicio_ontem <= normalizar_data(movimento.data) <= fim_ontem
    )

    vendas_mes = sum(
        movimento.valor_total or 0
        for movimento in saidas
        if normalizar_data(movimento.data)
        and inicio_mes <= normalizar_data(movimento.data) <= fim_hoje
    )

    vendas_mes_anterior = sum(
        movimento.valor_total or 0
        for movimento in saidas
        if normalizar_data(movimento.data)
        and inicio_mes_anterior <= normalizar_data(movimento.data) <= fim_comparacao_mes
    )

    def calcular_variacao(atual, anterior):
        if anterior > 0:
            return round(((atual - anterior) / anterior) * 100, 1)
        return 100 if atual > 0 else 0

    vendas_periodo_total = sum(
        movimento.valor_total or 0
        for movimento in saidas_periodo
    )

    grafico_vendas = []
    for indice in range(max(periodo_vendas, 1)):
        dia = inicio_periodo.date() + timedelta(days=indice)
        total_dia = sum(
            movimento.valor_total or 0
            for movimento in saidas_periodo
            if normalizar_data(movimento.data)
            and normalizar_data(movimento.data).date() == dia
        )
        grafico_vendas.append({
            "data": dia.strftime("%d/%m"),
            "valor": round(total_dia, 2),
        })

    vendidos_por_produto = {}
    for movimento in saidas:
        data_movimento = normalizar_data(movimento.data)
        if not data_movimento or not dentro_do_intervalo(data_movimento, inicio_produtos, fim_produtos):
            continue
        chave = movimento.produto_id or movimento.produto_nome
        produto_vendido = produtos_por_id.get(movimento.produto_id)
        if chave not in vendidos_por_produto:
            vendidos_por_produto[chave] = {
                "nome": produto_vendido.nome if produto_vendido else movimento.produto_nome,
                "imagem_url": produto_vendido.imagem_url if produto_vendido else None,
                "quantidade": 0,
            }
        vendidos_por_produto[chave]["quantidade"] += movimento.quantidade or 0

    produtos_mais_vendidos = sorted(
        vendidos_por_produto.values(),
        key=lambda item: item["quantidade"],
        reverse=True
    )[:5]

    ultimas_base = movimentacoes[:50]
    if not any(movimento.tipo == "entrada" for movimento in ultimas_base):
        ultima_entrada = next(
            (movimento for movimento in movimentacoes if movimento.tipo == "entrada"),
            None
        )
        if ultima_entrada:
            ultimas_base = [ultima_entrada] + ultimas_base[:49]

    ultimas_movimentacoes = [
        {
            "id": movimento.id,
            "tipo": movimento.tipo,
            "titulo": movimento.titulo,
            "desc": movimento.descricao,
            "data": formatar_data(movimento.data),
        }
        for movimento in ultimas_base
    ]

    lancamentos_financeiro = [
        lancamento
        for lancamento in lancamentos
        if dentro_do_intervalo(lancamento.data, inicio_financeiro, fim_financeiro)
    ]

    receitas = sum(
        lancamento.valor or 0
        for lancamento in lancamentos_financeiro
        if lancamento.tipo == "Receita"
    )
    despesas = sum(
        lancamento.valor or 0
        for lancamento in lancamentos_financeiro
        if lancamento.tipo == "Despesa"
    )

    dias_financeiro = sorted({
        normalizar_data(lancamento.data).date()
        for lancamento in lancamentos_financeiro
        if normalizar_data(lancamento.data)
    })

    if not dias_financeiro and filtro_financeiro != "tudo":
        dias_financeiro = [
            (inicio_financeiro.date() if inicio_financeiro else hoje) + timedelta(days=indice)
            for indice in range(
                max(
                    1,
                    ((fim_financeiro.date() if fim_financeiro else hoje) - (inicio_financeiro.date() if inicio_financeiro else hoje)).days + 1
                )
            )
        ][-10:]
    else:
        dias_financeiro = dias_financeiro[-10:]

    grafico_financeiro = []
    for dia in dias_financeiro:
        receitas_dia = sum(
            lancamento.valor or 0
            for lancamento in lancamentos_financeiro
            if lancamento.tipo == "Receita"
            and normalizar_data(lancamento.data)
            and normalizar_data(lancamento.data).date() == dia
        )
        despesas_dia = sum(
            lancamento.valor or 0
            for lancamento in lancamentos_financeiro
            if lancamento.tipo == "Despesa"
            and normalizar_data(lancamento.data)
            and normalizar_data(lancamento.data).date() == dia
        )
        grafico_financeiro.append({
            "dia": dia.strftime("%d/%m"),
            "receitas": round(receitas_dia, 2),
            "despesas": round(despesas_dia, 2),
        })

    return {
        "usuario": {
            "nome": usuario.nome,
            "cargo": usuario.perfil
        },
        "notificacoes_nao_lidas": len(produtos_estoque_baixo),
        "total_produtos": total_produtos,
        "total_itens": total_itens,
        "estoque_baixo": len(produtos_estoque_baixo),
        "sem_estoque": len([
            produto for produto in produtos if (produto.quantidade or 0) <= 0
        ]),
        "valor_estoque": round(valor_estoque, 2),
        "vendas_dia": round(vendas_dia, 2),
        "variacao_vendas_dia": calcular_variacao(vendas_dia, vendas_ontem),
        "vendas_mes": round(vendas_mes, 2),
        "variacao_vendas_mes": calcular_variacao(vendas_mes, vendas_mes_anterior),
        "vendas_semana_total": round(vendas_periodo_total, 2),
        "atualizado_em": datetime.now().strftime("%H:%M"),
        "grafico_vendas": grafico_vendas,
        "produtos_estoque_baixo": produtos_estoque_baixo[:5],
        "produtos_mais_vendidos": produtos_mais_vendidos,
        "ultimas_movimentacoes": ultimas_movimentacoes,
        "financeiro": {
            "receitas": round(receitas, 2),
            "despesas": round(despesas, 2),
            "lucro_liquido": round(receitas - despesas, 2),
            "grafico_barras": grafico_financeiro,
        },
    }
