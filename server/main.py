"""
This module defines the FastAPI application and its routes.

It includes routes for:
- A root endpoint that returns a simple greeting.
- A streaming chat endpoint that uses OpenAI's GPT-3 model to generate responses.
- An admin login endpoint that validates an admin password and returns an access token.
- A protected endpoint that requires authentication and returns a confirmation message.

It also includes helper functions and classes for handling messages 
and chat requests, and for managing admin authentication.

The application uses CORS middleware to allow requests from the React app running on localhost.

The application's routes are all included under the '/api' prefix.
"""

import os
from typing import AsyncIterable, List, Union, Dict
import hashlib
import logging
from logging.config import dictConfig
from datetime import timedelta, datetime, UTC
import asyncio
import json
import threading
from openai import APIError
import redis

from pydantic import BaseModel
from dotenv import load_dotenv

from fastapi import (
    FastAPI,
    Depends,
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_login import LoginManager
from fastapi_login.exceptions import InvalidCredentialsException
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain.callbacks import AsyncIteratorCallbackHandler


logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s %(message)s",
            "use_colors": True,
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "root": {
        "handlers": ["default"],
        "level": "INFO",
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO"},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

dictConfig(logging_config)
load_dotenv()


from lib.game_controller import (
    PlayerAlreadyExists,
    add_player_through_join_key,
    get_all_games,
    create_new_game,
    get_player_info,
    get_game_info,
    start_game,
    delete_game,
    deactivate_game,
    update_player_level,
    PlayerNotFound,
    GameNotFound,
)

from lib.level import is_code_correct, LEVELS

log = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY")
ADMIN_KEY = os.getenv("ADMIN_KEY")
REDIS_URL = os.getenv("REDIS_URL", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
DEFAULT_MODEL_NAME = "gpt-3.5-turbo"
DEFAULT_TEMPERATURE = 0.6

app = FastAPI()

log.info("Starting FastAPI application")

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

log.info('Redis URL %s:%s', REDIS_URL, REDIS_PORT)

# Try connecting to redis if failed then exit out

try:
    rds_client = redis.Redis.from_url(f"redis://{REDIS_URL}:{REDIS_PORT}")
    rds_client.ping()
except Exception as e:
    log.error("Error connecting to Redis: %s", e)
    exit(1)
    
log.info("Redis client connected")

connected_clients: Dict[str, List[WebSocket]] = {"admin": [], "players": []}

connected_players: Dict[str, WebSocket] = {}
connected_admins: List[WebSocket] = []

connected_players_lock = threading.Lock()
connected_admins_lock = threading.Lock()


def add_player_connection(player_id: str, websocket: WebSocket):
    """Add a player connection to the connected players."""
    with connected_players_lock:
        connected_players[player_id] = websocket


def add_admin_connection(websocket: WebSocket):
    """Add an admin connection to the connected admins."""
    with connected_admins_lock:
        connected_admins.append(websocket)


def remove_player_connection_by_ws(websocket: WebSocket):
    """Remove a player connection from the connected players."""
    with connected_players_lock:
        player_id = next(
            (k for k, v in connected_players.items() if v == websocket), None
        )
        if player_id:
            connected_players.pop(player_id, None)
            return player_id
    return None


def is_player_connected(player_id: str):
    """Check if a player is connected."""
    with connected_players_lock:
        return player_id in connected_players


def remove_admin_connection(websocket: WebSocket):
    """Remove an admin connection from the connected admins."""
    with connected_admins_lock:
        connected_admins.remove(websocket)


async def safe_send_json(client: WebSocket, data: dict):
    """Safely send JSON data to a WebSocket client."""
    try:
        await client.send_json(data)
    except Exception as e:
        log.error("Error sending message: %s", e)


def redis_subscribe():
    """Subscribe to Redis channels and broadcast messages to connected clients."""
    pubsub = rds_client.pubsub()
    pubsub.subscribe("game_updates", "player_scores")

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def handle_message():
        for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                log.debug("Received message: %s", data)
                tasks = []

                with connected_players_lock:
                    for client in connected_players.values():
                        tasks.append(safe_send_json(client, data))

                with connected_admins_lock:
                    for client in connected_admins:
                        tasks.append(safe_send_json(client, data))

                if tasks:
                    await asyncio.gather(*tasks)

    loop.run_until_complete(handle_message())


threading.Thread(target=redis_subscribe, daemon=True).start()


manager = LoginManager(SECRET_KEY, "/api/admin/login")


@manager.user_loader()
def load_user(user_id: str):
    """Load user from user_id."""
    log.info("User loaded: %s", user_id)
    return user_id if user_id == "admin" else None


def is_valid_admin_key(key: str):
    """Check if the given key matches the admin key."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest() == ADMIN_KEY


class Message(BaseModel):
    """A message model for chat messages."""

    id: int
    message: str
    user: bool

    def to_message(self):
        """Convert the message to a HumanMessage or AIMessage."""
        return (
            HumanMessage(content=self.message)
            if self.user
            else AIMessage(content=self.message)
        )


class ChatRequest(BaseModel):
    messages: List[Message]
    level: int


router = APIRouter()


@router.get("/")
def read_root():
    """A simple greeting message."""
    return {"Hello": "World"}


def get_system_message(level: int):
    """Get a system message for the chat assistant."""

    level_obj = LEVELS[int(level) - 1]
    code = level_obj["code"]
    system_message = level_obj["system_message"] % code

    return SystemMessage(content=system_message)


async def send_message(
    all_messages: List[Union[AIMessage, HumanMessage]], level: int
) -> AsyncIterable[str]:
    """Send messages to the chat assistant and yield the responses."""
    callback = AsyncIteratorCallbackHandler()
    level_obj = LEVELS[int(level) - 1]
    model = ChatOpenAI(
        streaming=True,
        verbose=True,
        model=level_obj.get("model", DEFAULT_MODEL_NAME),
        callbacks=[callback],
        temperature=level_obj.get("temperature", DEFAULT_TEMPERATURE)
    )

    log.debug("All messages: %s", all_messages)

    task = asyncio.create_task(
        model.agenerate(messages=[[get_system_message(level), *all_messages]])
    )

    try:
        async for token in callback.aiter():
            yield token
    except APIError as e:
        log.error("Error sending message: %s", e)
        yield "Error sending message"
    finally:
        callback.done.set()
    await task


@router.post("/stream_chat/")
async def stream_chat(req: ChatRequest):
    """Stream chat messages to the chat assistant and return the responses."""
    level = req.level
    if len(req.messages) > 40:
        raise HTTPException(status_code=400, detail="Too many messages")
    generator = send_message([message.to_message() for message in req.messages], level)
    return StreamingResponse(generator, media_type="text/event-stream")


@router.post("/admin/login")
def admin_login(data: dict):
    """Login an admin user and return an access token."""
    password = data.get("password")
    if not is_valid_admin_key(password):
        raise InvalidCredentialsException

    access_token = manager.create_access_token(
        data={"sub": "admin"}, expires=timedelta(days=2)
    )
    log.info("Admin logged in")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/admin")
def test_protected(_=Depends(manager)):
    """A protected endpoint that requires authentication."""
    return {"message": "You are authenticated"}


@router.get("/admin/games")
def fetch_all_games(_=Depends(manager)):
    """Fetch all games."""
    all_games = get_all_games()
    return all_games


@router.post("/admin/games")
def action_create_game(_=Depends(manager)):
    """Create a new game."""
    join_key = create_new_game()
    return {"join_key": join_key}


@router.post("/admin/game/delete")
def action_delete_game(data: dict, _=Depends(manager)):
    """Delete a game."""
    game_key = data.get("game_key")
    print("Delete game request: game_key", game_key)
    try:
        delete_game(game_key)

        message = {
            "type": "game_update",
            "action": "delete",
            "game_key": game_key,
        }

        rds_client.publish("game_updates", json.dumps(message))

        return {"message": "Game deleted"}
    except GameNotFound as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@router.post("/admin/game/deactivate")
def action_deactivate_game(data: dict, _=Depends(manager)):
    try:
        game_key = data.get("game_key")
        deactivate_game(game_key)
        message = {
            "type": "game_update",
            "action": "deactivate",
            "game_key": game_key,
        }

        rds_client.publish("game_updates", json.dumps(message))
        return {"message": "Game deactivated"}
    except GameNotFound as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@router.post("/admin/game/start")
def start_game_level(data: dict, _=Depends(manager)):
    game_key = data.get("game_key")
    level = data.get("level")
    try:
        started_at = start_game(game_key, level)

        message = {
            "type": "game_update",
            "action": "start",
            "game_key": game_key,
            "level": level,
            "started_at": started_at,
        }
        rds_client.publish("game_updates", json.dumps(message))
    except GameNotFound as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@router.websocket("/ws/player")
async def websocket_player_endpoint(websocket: WebSocket):
    """Handle player websocket connections."""
    await websocket.accept()
    log.info("Player connected")
    try:
        while True:
            data = await websocket.receive_json()
            try:
                if data.get("player_id") is None:
                    raise PlayerNotFound("Player not found")
                player_id = data["player_id"]
                add_player_connection(player_id, websocket)
                response = await handle_player_requests(data)
                await websocket.send_json(response)
            except HTTPException as e:
                await websocket.send_json(
                    {"type": "error", "error": e.detail, "status_code": e.status_code}
                )
            except (GameNotFound, PlayerNotFound) as e:
                log.info("Player not found: %s", e)
                await websocket.send_json(
                    {"type": "error", "error": str(e), "status_code": 404}
                )
                await websocket.close()
                remove_player_connection_by_ws(websocket)
                return
    except WebSocketDisconnect:
        log.info("Player disconnected")
        remove_player_connection_by_ws(websocket)


async def handle_player_requests(data: dict):
    """Handle player requests."""
    request_type = data.get("type")

    match request_type:
        case "connect":
            return await handle_player_connect(data)
        # default case raises an error
        case _:
            raise HTTPException(status_code=400, detail="Invalid request type")


async def handle_player_connect(data: dict):
    """Handle player connect requests."""
    game_id = data.get("game_id")
    player_id = data.get("player_id")
    player_info = get_player_info(game_id, player_id, active_only=True)
    if player_info is None:
        raise PlayerNotFound("Player not found")

    message = {
        "type": "player_update",
        "action": "join",
        "player": player_info,
        "game_key": game_id,
    }
    rds_client.publish("game_updates", json.dumps(message))
    return {"type": "connect", "player": player_info, "game": get_game_info(game_id)}


@router.post("/game/join")
def join_game(data: dict):
    game_key = data.get("game_key")
    player_name = data.get("player_name")
    try:
        game_id, player_id = add_player_through_join_key(
            game_key, player_name, active_only=True
        )
        return {"game_id": game_id, "player_id": player_id}
    except GameNotFound as exc:
        raise HTTPException(status_code=404, detail="Game not found") from exc
    except PlayerAlreadyExists as exc:
        raise HTTPException(status_code=400, detail="Player already exists") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Internal server error") from exc


@router.get("/game")
def get_game_and_player(game_key: str, player_id: str):
    player_info = get_player_info(game_key, player_id)
    game_info = get_game_info(game_key)
    if player_info is None:
        raise HTTPException(status_code=404, detail="Player not found")
    if game_info is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"player": player_info, "game": game_info}


@router.websocket("/ws/admin")
async def websocket_admin_endpoint(websocket: WebSocket):
    """Handle admin websocket connections."""
    await websocket.accept()
    log.info("Admin connected")
    add_admin_connection(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        log.info("Admin disconnected")
        remove_admin_connection(websocket)


def calculate_score(started_at: str):
    # started_at is isoformat utc time
    # find seconds since started_at to utcnow
    started_at = datetime.fromisoformat(started_at)
    now = datetime.now(UTC)
    return (now - started_at).total_seconds()


@router.post("/game/guess")
def gauss_code(data: dict):
    game_key = data.get("game_key")
    player_id = data.get("player_id")

    player_info = get_player_info(game_key, player_id)
    if player_info is None:
        print("GUESS_CODE: Player not found")
        raise HTTPException(status_code=404, detail="Player not found")

    guess = data.get("guess")
    level = str(player_info.get("level"))

    game_info = get_game_info(game_key)
    if game_info is None:
        print("GUESS_CODE: Game not found")
        raise HTTPException(status_code=404, detail="Game not found")

    if level not in game_info["levels"]:
        print("GUESS_CODE: Invalid level")
        raise HTTPException(status_code=400, detail="Invalid level")

    level_info = game_info["levels"][level]
    if not level_info["started"]:
        print("GUESS_CODE: Level not started")
        raise HTTPException(status_code=400, detail="Level not started")

    if is_code_correct(guess, level):
        score = calculate_score(level_info["started_at"])
        level = int(level) + 1
        update_player_level(game_key, player_id, level, score)
        message = {
            "type": "player_update",
            "action": "level_complete",
            "player_id": player_id,
            "game_key": game_key,
            "level": level,
        }
        rds_client.publish("game_updates", json.dumps(message))
        return {"message": "Correct guess", "correct": True}
    else:
        return {"message": "Incorrect guess", "correct": False}


app.include_router(router, prefix="/api")

app.mount("/assets", StaticFiles(directory="static/assets", html=True), name="static")


# add a catch all route
@app.get("/{catch_all:path}")
def catch_all(catch_all: str):
    return FileResponse("static/index.html")
