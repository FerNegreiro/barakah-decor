from datetime import datetime
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from openpyxl import Workbook
from openpyxl.cell.cell import MergedCell
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table as ExcelTable, TableStyleInfo
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from database import get_db
from services.relatorios import formatar_moeda, montar_dados_relatorio

router = APIRouter(tags=["Relatórios"])

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"
NOME_EXCEL = "relatorio_gerencial_barakah_decor.xlsx"
NOME_PDF = "relatorio_gerencial_barakah_decor.pdf"


@router.get("/relatorios")
def relatorios(db: Session = Depends(get_db)):
    dados = montar_dados_relatorio(db)
    return {
        "total_produtos": dados["total_produtos"],
        "total_itens": dados["total_itens"],
        "valor_total": dados["valor_total"],
        "estoque_baixo": dados["estoque_baixo"],
        "sem_estoque": dados["sem_estoque"],
        "total_vendido": dados["total_vendido"],
        "faturamento_vendas": dados["faturamento_vendas"],
        "produtos_mais_vendidos": dados["produtos_mais_vendidos"],
        "estoque_por_categoria": dados["estoque_por_categoria"],
        "produtos_estoque_baixo": dados["produtos_estoque_baixo"],
        "financeiro": dados["financeiro"],
    }


@router.get("/relatorios/excel")
def exportar_excel(db: Session = Depends(get_db)):

    dados = montar_dados_relatorio(db)
    wb = Workbook()

    verde = "006D3F"
    verde_claro = "ECF6EF"
    verde_texto = "08271F"
    dourado = "E0AA2F"
    vermelho = "EF1F1F"
    borda = Side(style="thin", color="D9E2DC")

    def formatar_aba(sheet):
        sheet.sheet_view.showGridLines = False
        for row in sheet.iter_rows():
            for cell in row:
                if isinstance(cell, MergedCell):
                    continue
                cell.alignment = Alignment(vertical="center")
                cell.border = Border(bottom=borda)
        for column in sheet.columns:
            max_length = max(len(str(cell.value or "")) for cell in column)
            sheet.column_dimensions[get_column_letter(column[0].column)].width = min(max(max_length + 4, 12), 42)

    def criar_tabela(sheet, nome, ref):
        if sheet.max_row <= 1:
            return
        tabela = ExcelTable(displayName=nome, ref=ref)
        tabela.tableStyleInfo = TableStyleInfo(
            name="TableStyleMedium4",
            showFirstColumn=False,
            showLastColumn=False,
            showRowStripes=True,
            showColumnStripes=False
        )
        sheet.add_table(tabela)

    def preparar_planilha(sheet, titulo=None, subtitulo=None, colunas=6):
        if titulo:
            ultima_coluna = get_column_letter(colunas)
            sheet.merge_cells(f"A1:{ultima_coluna}1")
            sheet["A1"] = titulo
            sheet["A1"].font = Font(bold=True, size=18, color=verde)
            sheet["A1"].fill = PatternFill("solid", fgColor=verde_claro)
            sheet["A1"].alignment = Alignment(horizontal="center", vertical="center")
            sheet.row_dimensions[1].height = 30
        if subtitulo:
            ultima_coluna = get_column_letter(colunas)
            sheet.merge_cells(f"A2:{ultima_coluna}2")
            sheet["A2"] = subtitulo
            sheet["A2"].font = Font(color=verde_texto)
            sheet["A2"].alignment = Alignment(horizontal="center", vertical="center")

    def escrever_tabela(sheet, inicio_linha, cabecalhos, linhas, nome_tabela):
        for col, cabecalho in enumerate(cabecalhos, start=1):
            cell = sheet.cell(row=inicio_linha, column=col, value=cabecalho)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill("solid", fgColor=verde)
            cell.alignment = Alignment(horizontal="center", vertical="center")

        if linhas:
            for linha in linhas:
                sheet.append(linha)
        else:
            sheet.append(["Sem dados registrados"] + [""] * (len(cabecalhos) - 1))

        fim = sheet.max_row
        criar_tabela(
            sheet,
            nome_tabela,
            f"A{inicio_linha}:{get_column_letter(len(cabecalhos))}{fim}"
        )
        return fim

    def formatar_moeda_excel(sheet, colunas, linha_inicial=2):
        for row in range(linha_inicial, sheet.max_row + 1):
            for col in colunas:
                sheet[f"{col}{row}"].number_format = 'R$ #,##0.00'

    ws = wb.active
    ws.title = "Resumo"
    preparar_planilha(
        ws,
        "Relatório Gerencial - Barakah Decor",
        f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        14
    )

    resumo = [
        ["Produtos cadastrados", dados["total_produtos"]],
        ["Itens em estoque", dados["total_itens"]],
        ["Valor total do estoque", dados["valor_total"]],
        ["Produtos com estoque baixo", dados["estoque_baixo"]],
        ["Produtos sem estoque", dados["sem_estoque"]],
        ["Unidades vendidas", dados["total_vendido"]],
        ["Faturamento por vendas", dados["faturamento_vendas"]],
        ["Receitas financeiras", dados["financeiro"]["receitas"]],
        ["Despesas financeiras", dados["financeiro"]["despesas"]],
        ["Lucro líquido", dados["financeiro"]["lucro"]],
    ]
    ws["A4"] = "Indicador"
    ws["B4"] = "Valor"
    for cell in ws[4]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=verde)
    for linha in resumo:
        ws.append(linha)
    for row in (7, 11, 12, 13, 14):
        ws[f"B{row}"].number_format = 'R$ #,##0.00'
    criar_tabela(ws, "TabelaResumoExecutivo", f"A4:B{ws.max_row}")

    def escrever_bloco_resumo(coluna_inicio, titulo, itens):
        linha_titulo = 4
        linha_cabecalho = 5
        coluna_fim = coluna_inicio + 2
        letra_inicio = get_column_letter(coluna_inicio)
        letra_fim = get_column_letter(coluna_fim)

        ws.merge_cells(f"{letra_inicio}{linha_titulo}:{letra_fim}{linha_titulo}")
        titulo_cell = ws.cell(row=linha_titulo, column=coluna_inicio, value=titulo)
        titulo_cell.font = Font(bold=True, color="FFFFFF")
        titulo_cell.fill = PatternFill("solid", fgColor=dourado)
        titulo_cell.alignment = Alignment(horizontal="center", vertical="center")

        cabecalhos = ["Período", "Entradas", "Saídas"]
        for offset, cabecalho in enumerate(cabecalhos):
            cell = ws.cell(row=linha_cabecalho, column=coluna_inicio + offset, value=cabecalho)
            cell.font = Font(bold=True, color=verde_texto)
            cell.fill = PatternFill("solid", fgColor=verde_claro)
            cell.alignment = Alignment(horizontal="center", vertical="center")

        linhas = itens or [{"periodo": "Sem dados", "entradas": 0, "saidas": 0}]
        for index, item in enumerate(linhas, start=6):
            ws.cell(row=index, column=coluna_inicio, value=item["periodo"])
            ws.cell(row=index, column=coluna_inicio + 1, value=item["entradas"])
            ws.cell(row=index, column=coluna_inicio + 2, value=item["saidas"])

    escrever_bloco_resumo(4, "Resumo diário", dados["resumo_movimentos"]["diario"][-7:])
    escrever_bloco_resumo(8, "Resumo semanal", dados["resumo_movimentos"]["semanal"][-6:])
    escrever_bloco_resumo(12, "Resumo mensal", dados["resumo_movimentos"]["mensal"][-12:])

    if dados["resumo_movimentos"]["mensal"]:
        chart = BarChart()
        chart.title = "Entradas x Saídas por mês"
        chart.y_axis.title = "Unidades"
        chart.x_axis.title = "Mês"
        chart.style = 10
        chart.legend.position = "r"
        chart.height = 5.6
        chart.width = 9
        linhas_mensais = min(len(dados["resumo_movimentos"]["mensal"]), 12)
        data = Reference(ws, min_col=13, max_col=14, min_row=5, max_row=5 + linhas_mensais)
        categorias_chart = Reference(ws, min_col=12, min_row=6, max_row=5 + linhas_mensais)
        chart.add_data(data, titles_from_data=True)
        chart.set_categories(categorias_chart)
        ws.add_chart(chart, "D17")

    vendidos = wb.create_sheet("Mais Vendidos")
    escrever_tabela(
        vendidos,
        1,
        ["Produto", "Categoria", "Unidades", "Faturamento", "Ticket Médio", "Participação", "Estoque"],
        [[
            item["nome"], item["categoria"], item["quantidade"], item["faturamento"],
            item["ticket_medio"], item["participacao"] / 100, item["estoque_atual"]
        ] for item in dados["produtos_mais_vendidos"]],
        "TabelaMaisVendidos"
    )
    for row in range(2, vendidos.max_row + 1):
        vendidos[f"D{row}"].number_format = 'R$ #,##0.00'
        vendidos[f"E{row}"].number_format = 'R$ #,##0.00'
        vendidos[f"F{row}"].number_format = '0.0%'

    produtos_sheet = wb.create_sheet("Produtos")
    escrever_tabela(
        produtos_sheet,
        1,
        ["ID", "Produto", "Categoria", "Quantidade", "Preço", "Valor em Estoque", "Status"],
        [[
            item["id"], item["nome"], item["categoria"], item["quantidade"],
            item["preco"], item["valor_total"], item["status"]
        ] for item in dados["produtos_detalhados"]],
        "TabelaProdutos"
    )
    formatar_moeda_excel(produtos_sheet, ("E", "F"))
    for row in range(2, produtos_sheet.max_row + 1):
        if produtos_sheet[f"G{row}"].value in ("Crítico", "Sem estoque"):
            produtos_sheet[f"G{row}"].font = Font(bold=True, color=vermelho)
        elif produtos_sheet[f"G{row}"].value == "Atenção":
            produtos_sheet[f"G{row}"].font = Font(bold=True, color=dourado)

    entradas_sheet = wb.create_sheet("Entradas")
    escrever_tabela(
        entradas_sheet,
        1,
        ["Data", "Produto", "Categoria", "Quantidade", "Descrição"],
        [[
            item["data_formatada"], item["produto"], item["categoria"],
            item["quantidade"], item["descricao"]
        ] for item in dados["entradas"]],
        "TabelaEntradas"
    )

    saidas_sheet = wb.create_sheet("Saídas")
    escrever_tabela(
        saidas_sheet,
        1,
        ["Data", "Produto", "Categoria", "Quantidade", "Valor", "Descrição"],
        [[
            item["data_formatada"], item["produto"], item["categoria"],
            item["quantidade"], item["valor"], item["descricao"]
        ] for item in dados["saidas"]],
        "TabelaSaidas"
    )
    formatar_moeda_excel(saidas_sheet, ("E",))

    movimentos_sheet = wb.create_sheet("Movimentações")
    escrever_tabela(
        movimentos_sheet,
        1,
        ["Data", "Tipo", "Título", "Produto", "Categoria", "Quantidade", "Valor", "Descrição"],
        [[
            item["data_formatada"], item["tipo"], item["titulo"], item["produto"],
            item["categoria"], item["quantidade"], item["valor"], item["descricao"]
        ] for item in dados["movimentacoes"]],
        "TabelaMovimentacoes"
    )
    formatar_moeda_excel(movimentos_sheet, ("G",))

    for titulo, chave, nome_tabela in (
        ("Resumo Diário", "diario", "TabelaResumoDiario"),
        ("Resumo Semanal", "semanal", "TabelaResumoSemanal"),
        ("Resumo Mensal", "mensal", "TabelaResumoMensal"),
    ):
        sheet = wb.create_sheet(titulo)
        escrever_tabela(
            sheet,
            1,
            ["Período", "Entradas", "Saídas", "Valor Vendido", "Saldo de Unidades"],
            [[
                item["periodo"], item["entradas"], item["saidas"],
                item["valor_vendido"], item["saldo"]
            ] for item in dados["resumo_movimentos"][chave]],
            nome_tabela
        )
        formatar_moeda_excel(sheet, ("D",))

    categorias = wb.create_sheet("Categorias")
    escrever_tabela(
        categorias,
        1,
        ["Categoria", "Produtos", "Quantidade", "Valor em Estoque"],
        [[item["categoria"], item["produtos"], item["quantidade"], item["valor"]]
         for item in dados["estoque_por_categoria"]],
        "TabelaCategorias"
    )
    formatar_moeda_excel(categorias, ("D",))

    financeiro = wb.create_sheet("Financeiro")
    escrever_tabela(
        financeiro,
        1,
        ["Data", "Receitas", "Despesas", "Resultado"],
        [[item["data"], item["receitas"], item["despesas"], item["resultado"]]
         for item in dados["financeiro"]["por_dia"]],
        "TabelaFinanceiro"
    )
    formatar_moeda_excel(financeiro, ("B", "C", "D"))

    for sheet in wb.worksheets:
        formatar_aba(sheet)
        sheet.freeze_panes = "A5" if sheet.title == "Resumo" else "A2"

    buffer = BytesIO()
    wb.save(buffer)

    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{NOME_EXCEL}"'}
    )


@router.get("/relatorios/pdf")
def exportar_pdf(db: Session = Depends(get_db)):

    dados = montar_dados_relatorio(db)
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=28,
        leftMargin=28,
        topMargin=185,
        bottomMargin=24
    )

    estilos = getSampleStyleSheet()
    estilos.add(ParagraphStyle(
        name="SectionTitle",
        parent=estilos["Heading2"],
        textColor=colors.HexColor("#006D3F"),
        spaceBefore=12,
        spaceAfter=8
    ))
    estilos.add(ParagraphStyle(
        name="TableSmall",
        parent=estilos["Normal"],
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#08271F")
    ))
    estilos.add(ParagraphStyle(
        name="Muted",
        parent=estilos["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#5F6F68")
    ))

    def texto(valor):
        return Paragraph(str(valor if valor is not None else ""), estilos["TableSmall"])

    def tabela_padrao(linhas, col_widths, cor_cabecalho="#006D3F", cor_linha="#F7FAF8"):
        tabela = Table(linhas, colWidths=col_widths, repeatRows=1)
        tabela.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(cor_cabecalho)),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D9E2DC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor(cor_linha)]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return tabela

    elementos = [
        Paragraph("Relatório Gerencial - Barakah Decor", estilos["Title"]),
    ]
    elementos.append(Paragraph(f"Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}", estilos["Normal"]))
    elementos.append(Spacer(1, 14))

    resumo = [
        ["Produtos", dados["total_produtos"], "Itens", dados["total_itens"], "Estoque baixo", dados["estoque_baixo"]],
        ["Valor estoque", formatar_moeda(dados["valor_total"]), "Vendido", dados["total_vendido"], "Faturamento", formatar_moeda(dados["faturamento_vendas"])],
        ["Receitas", formatar_moeda(dados["financeiro"]["receitas"]), "Despesas", formatar_moeda(dados["financeiro"]["despesas"]), "Lucro", formatar_moeda(dados["financeiro"]["lucro"])],
    ]
    tabela_resumo = Table(resumo, colWidths=[90, 90, 90, 90, 90, 110])
    tabela_resumo.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECF6EF")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#08271F")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#D9E2DC")),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D9E2DC")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elementos.append(tabela_resumo)

    elementos.append(Paragraph("Resumo de Movimentações", estilos["SectionTitle"]))
    resumo_mensal = [["Período", "Entradas", "Saídas", "Valor vendido", "Saldo"]]
    for item in dados["resumo_movimentos"]["mensal"][-12:]:
        resumo_mensal.append([
            item["periodo"], item["entradas"], item["saidas"],
            formatar_moeda(item["valor_vendido"]), item["saldo"]
        ])
    if len(resumo_mensal) == 1:
        resumo_mensal.append(["Sem movimentações registradas", "-", "-", "-", "-"])
    elementos.append(tabela_padrao(resumo_mensal, [120, 80, 80, 110, 80], "#006D3F"))

    elementos.append(Paragraph("Produtos Mais Vendidos", estilos["SectionTitle"]))
    vendidos = [["Produto", "Categoria", "Un.", "Faturamento", "Ticket", "% vendas", "Estoque"]]
    for item in dados["produtos_mais_vendidos"][:12]:
        vendidos.append([
            texto(item["nome"]), texto(item["categoria"]), item["quantidade"],
            formatar_moeda(item["faturamento"]), formatar_moeda(item["ticket_medio"]),
            f"{item['participacao']}%", item["estoque_atual"]
        ])
    if len(vendidos) == 1:
        vendidos.append(["Sem vendas registradas", "-", "-", "-", "-", "-", "-"])
    elementos.append(tabela_padrao(vendidos, [165, 100, 45, 90, 75, 65, 60], "#006D3F"))

    elementos.append(Paragraph("Produtos em Atenção", estilos["SectionTitle"]))
    baixos = [["Produto", "Categoria", "Qtd.", "Mínimo", "Status", "Reposição", "Valor"]]
    for item in dados["produtos_estoque_baixo"][:14]:
        baixos.append([
            texto(item["nome"]), texto(item["categoria"]), item["quantidade"],
            item["minimo"], item["status"], item["reposicao_sugerida"],
            formatar_moeda(item["valor_total"])
        ])
    if len(baixos) == 1:
        baixos.append(["Nenhum produto com estoque baixo", "-", "-", "-", "-", "-", "-"])
    elementos.append(tabela_padrao(baixos, [150, 95, 45, 55, 70, 65, 85], "#EF1F1F", "#FFF4F2"))

    elementos.append(Paragraph("Estoque por Categoria", estilos["SectionTitle"]))
    categorias = [["Categoria", "Produtos", "Quantidade", "Valor em estoque"]]
    for item in dados["estoque_por_categoria"][:10]:
        categorias.append([texto(item["categoria"]), item["produtos"], item["quantidade"], formatar_moeda(item["valor"])])
    elementos.append(tabela_padrao(categorias, [210, 90, 100, 130], "#E0AA2F"))

    elementos.append(Paragraph("Últimas Entradas", estilos["SectionTitle"]))
    entradas = [["Data", "Produto", "Categoria", "Qtd.", "Descrição"]]
    for item in dados["entradas"][:12]:
        entradas.append([
            item["data_formatada"], texto(item["produto"]), texto(item["categoria"]),
            item["quantidade"], texto(item["descricao"])
        ])
    if len(entradas) == 1:
        entradas.append(["Sem entradas registradas", "-", "-", "-", "-"])
    elementos.append(tabela_padrao(entradas, [95, 150, 95, 45, 230], "#006D3F"))

    elementos.append(Paragraph("Últimas Saídas / Vendas", estilos["SectionTitle"]))
    saidas = [["Data", "Produto", "Categoria", "Qtd.", "Valor", "Descrição"]]
    for item in dados["saidas"][:12]:
        saidas.append([
            item["data_formatada"], texto(item["produto"]), texto(item["categoria"]),
            item["quantidade"], formatar_moeda(item["valor"]), texto(item["descricao"])
        ])
    if len(saidas) == 1:
        saidas.append(["Sem saídas registradas", "-", "-", "-", "-", "-"])
    elementos.append(tabela_padrao(saidas, [95, 135, 90, 45, 75, 205], "#006D3F"))

    elementos.append(Paragraph("Financeiro por Dia", estilos["SectionTitle"]))
    financeiro = [["Data", "Receitas", "Despesas", "Resultado"]]
    for item in dados["financeiro"]["por_dia"][-12:]:
        financeiro.append([
            item["data"], formatar_moeda(item["receitas"]),
            formatar_moeda(item["despesas"]), formatar_moeda(item["resultado"])
        ])
    if len(financeiro) == 1:
        financeiro.append(["Sem lançamentos financeiros", "-", "-", "-"])
    elementos.append(tabela_padrao(financeiro, [120, 110, 110, 110], "#006D3F"))

    def desenhar_cabecalho(canvas, documento):
        header_path = ASSETS_DIR / "pdf_header.jpeg"
        if not header_path.exists():
            return
        largura = 460
        altura = 153
        x = (documento.pagesize[0] - largura) / 2
        y = documento.pagesize[1] - altura - 18
        canvas.drawImage(
            str(header_path),
            x,
            y,
            width=largura,
            height=altura,
            preserveAspectRatio=True,
            mask="auto"
        )

    doc.build(elementos, onFirstPage=desenhar_cabecalho, onLaterPages=desenhar_cabecalho)

    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{NOME_PDF}"'}
    )
