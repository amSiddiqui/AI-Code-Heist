"""
This module contains the game controller functions.
"""

import random
from datetime import datetime, UTC
import uuid

from server.firebase_helper import db


GAMES_COLLECTION = db.collection("games")


def get_player_info(join_key: str, player_id: str):
    """Get player info from a game."""
    game = GAMES_COLLECTION.document(join_key).get()
    print("Game Retrieved", game.id)
    if not game.exists:
        print("Game not found with id:", join_key)
        return None
    print("Game found with id:", join_key)
    game_data = game.to_dict()
    players = game_data["players"]
    if player_id not in players:
        print("Player not found with id: %s", player_id)
        return None

    player = players[player_id]
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


def delete_game(join_key: str):
    GAMES_COLLECTION.document(join_key).delete()


def generate_4_digit_code():
    return str(random.randint(1000, 9999))


class FailedToGenerateUniqueJoinKey(Exception):
    pass


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
    }

    GAMES_COLLECTION.document(join_key).set(game_data)
    return join_key


def check_if_document_exists(join_key: str):
    return GAMES_COLLECTION.document(join_key).get().exists
