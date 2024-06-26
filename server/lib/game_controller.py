"""
This module contains the game controller functions.

The game controller module provides functions for managing game data and operations,
such as adding players, updating player levels, starting games, and retrieving game information.
"""

import random
from datetime import datetime, UTC
import uuid
import logging
import json

from redis import Redis
from .level import LEVELS, generate_code_based_on_level_type

from .firebase_helper import db


log = logging.getLogger(__name__)

GAMES_COLLECTION = db.collection("games")


def get_player_info(join_key: str, player_id: str, active_only: bool = False):
    """Get player info from a game."""
    game = GAMES_COLLECTION.document(join_key).get()
    if not game.exists:
        return None
    game_data = game.to_dict()
    if active_only and game_data["status"] != "active":
        return None
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
    """Exception raised when a game is not found."""


class PlayerNotFound(Exception):
    """Exception raised when a player is not found."""


class PlayerAlreadyExists(Exception):
    """Exception raised when a player already exists."""


def add_player_through_join_key(join_key: str, name: str, active_only: bool = False):
    """
    Add a player to a game using the join key.

    Args:
        join_key (str): The join key of the game.
        name (str): The name of the player.
        active_only (bool, optional): If True, only add the player if the game is active. Defaults to False.

    Returns:
        tuple: A tuple containing the join key and the player ID.

    Raises:
        GameNotFound: If the game with the given join key does not exist.
        PlayerAlreadyExists: If a player with the same name already exists in the game.
    """
    # check if game exists
    game = GAMES_COLLECTION.document(join_key).get()
    if not game.exists:
        raise GameNotFound

    # check if player already exists
    game_data = game.to_dict()
    if active_only and game_data["status"] != "active":
        raise GameNotFound

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
    """
    Generate a random 4-digit code.

    Returns:
        str: The generated 4-digit code.
    """
    return str(random.randint(1000, 9999))


class FailedToGenerateUniqueJoinKey(Exception):
    """Exception raised when a unique join key could not be generated."""


def get_game_info(join_key: str):
    """
    Get information about a game.

    Args:
        join_key (str): The join key of the game.

    Returns:
        dict: A dictionary containing the game information.

    Raises:
        GameNotFound: If the game with the given join key does not exist.
    """
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
    """
    Update the level and score of a player in a game.

    Args:
        join_key (str): The join key of the game.
        player_id (str): The ID of the player.
        level (int): The new level of the player.
        score (int): The score achieved by the player.

    Raises:
        GameNotFound: If the game with the given join key does not exist.
        PlayerNotFound: If the player with the given ID does not exist in the game.
    """
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


def create_new_game(rds_client: Redis):
    """
    Create a new game.

    Args:
        rds_client (Redis): The Redis client.

    Returns:
        str: The join key of the newly created game.

    Raises:
        FailedToGenerateUniqueJoinKey: If a unique join key could not be generated after multiple retries.
    """
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
            level["level"]: {
                "code": generate_code_based_on_level_type(level["level_type"]),
                "started_at": None,
                "started": False,
            }
            for level in LEVELS
        },
    }

    GAMES_COLLECTION.document(join_key).set(game_data)
    rds_client.set(join_key, json.dumps(game_data["levels"]))

    return join_key


def get_level_code(join_key: str, level: str, rds_client: Redis):
    """
    Get the code for a specific level in a game.

    Args:
        join_key (str): The join key of the game.
        level (str): The level for which to get the code.
        rds_client (Redis): The Redis client.

    Returns:
        str: The code for the specified level.

    Raises:
        GameNotFound: If the game with the given join key does not exist.
        ValueError: If the specified level is not found in the game.
    """
    # check if exists in redis
    level_code = rds_client.get(join_key)
    if level_code:
        return json.loads(level_code)[level]["code"]
    # if not then fetch from firestore and update the redis cache
    game = GAMES_COLLECTION.document(join_key).get()
    if not game.exists:
        raise GameNotFound
    game_data = game.to_dict()
    levels = game_data["levels"]
    if level not in levels:
        raise ValueError("Level not found")
    rds_client.set(join_key, json.dumps(levels))
    return levels[level]["code"]


def start_game(game_key: str, level: str):
    """
    Start a game at a specific level.

    Args:
        game_key (str): The join key of the game.
        level (str): The level to start the game at.

    Returns:
        str: The timestamp when the game was started.

    Raises:
        GameNotFound: If the game with the given join key does not exist.
        ValueError: If the specified level is not found in the game.
    """
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
    """
    Delete a game.

    Args:
        game_key (str): The join key of the game.
    """
    doc_ref = GAMES_COLLECTION.document(game_key)
    doc_ref.delete()


def deactivate_game(game_key: str):
    """
    Deactivate a game.

    Args:
        game_key (str): The join key of the game.

    Returns:
        bool: True if the game was successfully deactivated, False otherwise.
    """
    doc_ref = GAMES_COLLECTION.document(game_key)
    doc_ref.update({"status": "deactive"})
    return True


def check_if_document_exists(join_key: str):
    """
    Check if a game document exists in the database.

    Args:
        join_key (str): The join key of the game.

    Returns:
        bool: True if the game document exists, False otherwise.
    """
    game_ref = GAMES_COLLECTION.document(join_key).get()
    return game_ref.exists
