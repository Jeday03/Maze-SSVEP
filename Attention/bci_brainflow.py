import argparse
import asyncio
import json
import math
import time
from typing import List, Tuple

import numpy as np
from sklearn.cross_decomposition import CCA
import websockets

from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from brainflow.data_filter import (
    DataFilter, FilterTypes, DetrendOperations, NoiseTypes
)

# ===================== CONFIG PADRÃO =====================
FREQS = {
    "up":    12.0,
    "left":  10.0,
    "right": 15.0,
    "down":   8.0,
}
ORDER        = ["up", "left", "right", "down"]
HARMONICS    = 4
WINDOW_SEC   = 2.0
STEP_SEC     = 0.2
BAND_LO_HZ   = 5.0
BAND_HI_HZ   = 40.0
NOTCH_HZ     = 50.0
MIN_CONF     = 0.0
WS_HOST      = "localhost"
WS_PORT      = 8767
# ========================================================


# ========================= CCA ==========================
def build_ref(freq: float, sfreq: float, n_samples: int, harmonics: int) -> np.ndarray:
    t = np.arange(n_samples) / sfreq
    Y = []
    for k in range(1, harmonics + 1):
        Y.append(np.sin(2 * math.pi * freq * k * t))
        Y.append(np.cos(2 * math.pi * freq * k * t))
    return np.asarray(Y).T

def run_cca(X: np.ndarray, sfreq: float) -> Tuple[str, float]:
    if X.ndim != 2 or X.shape[1] < 10:
        return "down", 0.0
    Xs = X.T
    best_dir, best_r = None, -1.0
    for d in ORDER:
        Y = build_ref(FREQS[d], sfreq, Xs.shape[0], HARMONICS)
        cca = CCA(n_components=1, max_iter=500)
        Xc, Yc = cca.fit_transform(Xs, Y)
        r = np.corrcoef(Xc[:, 0], Yc[:, 0])[0, 1]
        r = 0.0 if np.isnan(r) else float(abs(r))
        if r > best_r:
            best_r, best_dir = r, d
    return best_dir, best_r
# =======================================================


# =================== PIPELINE BRAINFLOW =================
def select_eeg_channels(board_id: int, prefer_idx: List[int] | None) -> List[int]:
    """Retorna índices de canais EEG do BrainFlow, opcionalmente filtrados por --chan-idx."""
    all_eeg = BoardShim.get_eeg_channels(board_id)
    if prefer_idx:
        # normaliza possíveis índices 1-based para 0-based no contexto "da lista all_eeg"
        # aqui prefer_idx são índices globais do dispositivo (0..N-1). Mantem apenas os válidos.
        ok = [i for i in prefer_idx if i in all_eeg]
        return ok if ok else all_eeg
    return all_eeg

async def ws_loop(board: BoardShim, board_id: int, eeg_ch: list[int]):
    sfreq = BoardShim.get_sampling_rate(board_id)
    need  = int(WINDOW_SEC * sfreq)
    print(f"[BCI] sfreq={sfreq} | eeg_ch={eeg_ch}")
    print(f"[BCI] WS em ws://{WS_HOST}:{WS_PORT}")

    async def handler(websocket):
        print("[BCI] Front conectado")

        buf = np.zeros((len(eeg_ch), 0), dtype=np.float64)

        try:
            while True:
                # pegar só o delta desde a última chamada
                data = board.get_board_data()  # (n_channels, n_new_samples)
                if data.shape[1] > 0:
                    # extrair apenas EEG e empilhar no buffer
                    x_new = data[eeg_ch, :]                      # (n_eeg, n_new)
                    buf   = np.concatenate([buf, x_new], axis=1) # cresce

                    # manter apenas a janela necessária
                    if buf.shape[1] > need:
                        buf = buf[:, -need:]

                    # quando tiver a janela cheia, processa
                    if buf.shape[1] == need:
                        X = buf.copy()

                        # Pré-processamento por canal
                        for ch in range(X.shape[0]):
                            DataFilter.detrend(X[ch], DetrendOperations.LINEAR.value)
                            DataFilter.remove_environmental_noise(
                                X[ch], sfreq,
                                NoiseTypes.FIFTY.value if int(NOTCH_HZ) == 50 else NoiseTypes.SIXTY.value
                            )
                            DataFilter.perform_bandpass(
                                X[ch], sfreq, BAND_LO_HZ, BAND_HI_HZ, 4,
                                FilterTypes.BUTTERWORTH.value, 0
                            )

                        # CCA
                        direction, conf = run_cca(X, sfreq)

                        # Enviar sempre que passar do limiar (use 0.0 para ver tudo)
                        if conf >= MIN_CONF:
                            msg = {
                                "intent": direction,
                                "conf": round(float(conf), 3),
                                "timestamp": time.time(),
                                "source": "brainflow+cca"
                            }
                            await websocket.send(json.dumps(msg))

                await asyncio.sleep(STEP_SEC)
        except Exception as e:
            print("[BCI] WS encerrado:", e)

    async with websockets.serve(handler, WS_HOST, WS_PORT):
        print("[BCI] Aguardando conexão do front (Ctrl+C para parar)")
        await asyncio.Future()



def set_if(val, setter):
    """Só seta param do BrainFlow se valor for válido (evita None)."""
    if isinstance(val, str) and val.strip() != "":
        setter(val)
    elif isinstance(val, int) and val > 0:
        setter(val)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--board-id", type=int, default=BoardIds.SYNTHETIC_BOARD.value,
                    help="Ex.: -1 sintética, 0 Cyton, 2 Cyton+Daisy")
    ap.add_argument("--serial-port", type=str, default="", help="Ex.: COM3 no Windows")
    ap.add_argument("--ip-port", type=int, default=0)
    ap.add_argument("--ip-address", type=str, default="")
    ap.add_argument("--mac-address", type=str, default="")
    ap.add_argument("--other-info", type=str, default="")
    ap.add_argument("--serial-number", type=str, default="")
    ap.add_argument("--file", type=str, default="")

    ap.add_argument("--chan-idx", type=str, default="",
                    help='Lista de índices de canais EEG do dispositivo (ex: "9,10,11,12"). '
                         'Usa apenas índices que pertencem à lista EEG do BrainFlow.')
    args = ap.parse_args()

    BoardShim.enable_dev_board_logger()
    params = BrainFlowInputParams()
    set_if(args.serial_port,   lambda v: setattr(params, "serial_port", v))
    set_if(args.ip_port,       lambda v: setattr(params, "ip_port", v))
    set_if(args.ip_address,    lambda v: setattr(params, "ip_address", v))
    set_if(args.mac_address,   lambda v: setattr(params, "mac_address", v))
    set_if(args.other_info,    lambda v: setattr(params, "other_info", v))
    set_if(args.serial_number, lambda v: setattr(params, "serial_number", v))
    set_if(args.file,          lambda v: setattr(params, "file", v))

    board_id = args.board_id
    board = BoardShim(board_id, params)

    prefer_idx = None
    if args.chan_idx.strip():
        try:
            prefer_idx = [int(x.strip()) for x in args.chan_idx.split(",") if x.strip()]
        except Exception:
            prefer_idx = None

    try:
        board.prepare_session()
        board.start_stream(num_samples=45000)

        eeg_ch = select_eeg_channels(board_id, prefer_idx)
        asyncio.run(ws_loop(board, board_id, eeg_ch))

    except KeyboardInterrupt:
        pass
    finally:
        try:
            board.stop_stream()
        except Exception:
            pass
        try:
            board.release_session()
        except Exception:
            pass
        print("[BCI] Sessão encerrada")


if __name__ == "__main__":
    main()
