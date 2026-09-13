import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router, simulation
from app.config import settings
from app.websocket.manager import ConnectionManager

app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router, prefix="/api")
manager = ConnectionManager()


@app.websocket("/ws/simulation")
async def simulation_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await manager.send(websocket, simulation.tick().model_dump())
            await asyncio.sleep(1.5)
    except (WebSocketDisconnect, RuntimeError):
        pass
    finally:
        manager.disconnect(websocket)