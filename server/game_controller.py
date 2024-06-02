"""
This module contains the game controller functions.
"""

import random
from datetime import datetime, UTC
import uuid
from server.level import LEVELS

from server.firebase_helper import db


GAMES_COLLECTION = db.collection("games")


def get_player_info(join_key: str, player_id: str):
    """Get player info from a game."""
    game = GAMES_COLLECTION.document(join_key).get()
    if not game.exists:
        return None
    game_data = game.to_dict()
    players = game_data["players"]
    if player_id not in players:
        return None

    player = players[player_id]
    player["player_id"] = player_id
    return player


def get_all_games():
    """Get all games."""
    games = GAMES_COLLECTION.stream()
    all_games = [game.to_dict() for game in games]

    return all_games


class GameNotFound(Exception):
    pass


class PlayerNotFound(Exception):
    pass


class PlayerAlreadyExists(Exception):
    pass


def add_player_through_join_key(join_key: str, name: str):
    # check if game exists
    game = GAMES_COLLECTION.document(join_key).get()
    if not game.exists:
        raise GameNotFound

    # check if player already exists
    game_data = game.to_dict()
    players = game_data["players"]
    for player_id, player in players.items():
        if player["name"] == name:
            raise PlayerAlreadyExists

    # add player
    player_id = uuid.uuid4().hex
    player_data = {
        "name": name,
        "level": 1,
        "created_at": datetime.now(UTC).isoformat(),
        "status": "active",  # active, banned
        "score": {},
    }
    players[player_id] = player_data
    GAMES_COLLECTION.document(join_key).update({"players": players})
    return join_key, player_id


def generate_4_digit_code():
    return str(random.randint(1000, 9999))


class FailedToGenerateUniqueJoinKey(Exception):
    pass


def get_game_info(join_key: str):
    games = GAMES_COLLECTION.document(join_key).get()
    games_dict = games.to_dict()
    info = {
        "join_key": join_key,
        "players": games_dict["players"],
        "status": games_dict["status"],
        "created_at": games_dict["created_at"],
        "levels": {
            level: {
                "started_at": value["started_at"],
                "started": value["started"],
            }
            for level, value in games_dict["levels"].items()
        },
    }

    return info


def update_player_level(join_key: str, player_id: str, level: int, score: int):
    game = GAMES_COLLECTION.document(join_key).get()
    if not game.exists:
        raise GameNotFound

    game_data = game.to_dict()
    players = game_data["players"]
    if player_id not in players:
        raise PlayerNotFound

    players[player_id]["level"] = level
    players[player_id]["score"][str(level)] = score
    GAMES_COLLECTION.document(join_key).update({"players": players})


def create_new_game():
    join_key = generate_4_digit_code()
    retry = 0
    while check_if_document_exists(join_key):
        join_key = generate_4_digit_code()
        retry += 1
        if retry > 10:
            raise FailedToGenerateUniqueJoinKey

    created_at = datetime.now(UTC).isoformat()
    game_data = {
        "join_key": join_key,
        "players": {},
        "status": "active",
        "created_at": created_at,
        "levels": {
            level['level']: {
                "code": level["code"],
                "started_at": None,
                "started": False,
            }
            for level in LEVELS
        },
    }

    GAMES_COLLECTION.document(join_key).set(game_data)
    return join_key


def start_game(game_key: str, level: str):
    game = GAMES_COLLECTION.document(game_key).get()
    if not game.exists:
        raise GameNotFound
    
    game_data = game.to_dict()
    levels = game_data["levels"]
    if level not in levels:
        raise ValueError("Level not found")
    
    started_at = datetime.now(UTC).isoformat()
    levels[level]["started_at"] = started_at
    levels[level]["started"] = True
    GAMES_COLLECTION.document(game_key).update({"levels": levels})
    return started_at


def delete_game(game_key: str):
    doc_ref = GAMES_COLLECTION.document(game_key)
    doc_ref.delete()


def check_if_document_exists(join_key: str):
    game_ref = GAMES_COLLECTION.document(join_key).get()
    return game_ref.exists
