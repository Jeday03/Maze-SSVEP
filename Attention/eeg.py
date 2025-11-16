from datetime import datetime, timedelta
import numpy as np
from fastapi import FastAPI
import asyncio
import websockets
import json

app = FastAPI()

def get_regg():
    freq = 125
    t0 = datetime.now()
    signal = np.random.rand(16, 63)
    
    # Converte os datetime para strings no formato ISO 8601
    time_list = np.array([(t0 + timedelta(seconds=i/freq)).isoformat() for i in range(63)])
    time_list = time_list.reshape((1, 63))
    
    return np.concatenate([time_list, signal], axis=0)

async def send_matrix():
    uri = "ws://localhost:8765"  # URL do WebSocket Server (Node.js)
    async with websockets.connect(uri) as websocket:
        while True:
            matrix = get_regg()
            matrix_list = matrix[1][0].tolist() # Retirar [0]dps
            await websocket.send(json.dumps({"matrix": matrix_list}))  # Envia a matriz para o WebSocket
            await asyncio.sleep(0.5)  # Espera 0.5 segundos

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(send_matrix())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
