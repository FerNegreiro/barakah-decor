import time
from collections import defaultdict, deque
from threading import Lock

MAX_TENTATIVAS_EMAIL = 5
MAX_TENTATIVAS_IP = 20
JANELA_SEGUNDOS = 15 * 60

_tentativas = defaultdict(deque)
_trava = Lock()


def _limpar(fila, agora):
    while fila and agora - fila[0] > JANELA_SEGUNDOS:
        fila.popleft()


def ip_da_requisicao(request):
    encaminhado = request.headers.get("x-forwarded-for", "")
    if encaminhado:
        return encaminhado.split(",")[0].strip()
    return request.client.host if request.client else "desconhecido"


def segundos_bloqueado(chave, limite):
    agora = time.monotonic()
    with _trava:
        fila = _tentativas[chave]
        _limpar(fila, agora)
        if len(fila) < limite:
            return 0
        return int(JANELA_SEGUNDOS - (agora - fila[0])) + 1


def registrar_falha(chave):
    with _trava:
        _tentativas[chave].append(time.monotonic())


def limpar_tentativas(chave):
    with _trava:
        _tentativas.pop(chave, None)
