from sqlalchemy.orm import Session

from models import Configuracao

PADROES = {
    "empresa": "Barakah Decor",
    "telefone": "",
    "email": "",
    "cidade": "",
    "whatsapp": "",
    "estoque_minimo_padrao": 30,
    "percentual_critico": 66,
}

CAMPOS_INTEIROS = {"estoque_minimo_padrao", "percentual_critico"}


def converter_valor(chave, valor):
    if chave not in CAMPOS_INTEIROS:
        return valor or ""
    try:
        return int(valor)
    except (TypeError, ValueError):
        return PADROES[chave]


def obter_configuracoes(db: Session):
    salvas = {item.chave: item.valor for item in db.query(Configuracao).all()}
    return {
        chave: converter_valor(chave, salvas.get(chave, padrao))
        for chave, padrao in PADROES.items()
    }


def salvar_configuracoes(db: Session, valores: dict):
    existentes = {item.chave: item for item in db.query(Configuracao).all()}
    for chave, valor in valores.items():
        if chave not in PADROES:
            continue
        texto = str(valor if valor is not None else "")
        if chave in existentes:
            existentes[chave].valor = texto
        else:
            db.add(Configuracao(chave=chave, valor=texto))
    db.commit()
    return obter_configuracoes(db)


def obter_regras_estoque(db: Session):
    configuracoes = obter_configuracoes(db)
    return {
        "estoque_minimo_padrao": configuracoes["estoque_minimo_padrao"],
        "percentual_critico": configuracoes["percentual_critico"],
    }
