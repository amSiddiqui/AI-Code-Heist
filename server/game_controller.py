import random
from datetime import datetime, UTC
import uuid

from server.firebase_helper import db

GAMES_COLLECTION = db.collection("games")


def get_player_info(game_id: str, player_id: str):
    game = GAMES_COLLECTION.document(game_id).get()
    if not game.exists:
        return None

    game_data = game.to_dict()
    players = game_data["players"]
    if player_id not in players:
        return None

    player = players[player_id]
    return player


def get_all_games():
    games = GAMES_COLLECTION.stream()
    return [{
        'join_key': game.get('join_key'),
        'created_at': game.get('created_at'),
        'status': game.get('status'),
        'game_id': game.id
    } for game in games]

def get_players(game_id: str):
    game = GAMES_COLLECTION.document(game_id).get()
    if not game.exists:
        return None

    game_data = game.to_dict()
    players = game_data["players"]
    # add player_id to player data
    for player_id, player in players.items():
        player["player_id"] = player_id
    return list(players.values())

class GameNotFound(Exception):
    pass

class PlayerAlreadyExists(Exception):
    pass

def add_player_through_join_key(join_key: str, name: str):
    # check if game exists
    games = GAMES_COLLECTION.where("join_key", "==", join_key).stream()
    game = None
    for g in games:
        game = g
        break
    if game is None:
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
        "score": {},
    }
    players[player_id] = player_data
    GAMES_COLLECTION.document(game.id).update({"players": players})
    return player_id, game.id


def delete_game(game_id: str):
    GAMES_COLLECTION.document(game_id).delete()


def generate_4_digit_code():
    return str(random.randint(1000, 9999))


def create_new_game():
    join_key = generate_4_digit_code()
    created_at = datetime.now(UTC).isoformat()
    game_data = {
        "join_key": join_key,
        "players": {},
        "status": "active",
        "created_at": created_at,
    }
    game_ref = GAMES_COLLECTION.add(game_data)
    game_id = game_ref[1].id
    return game_id, join_key
