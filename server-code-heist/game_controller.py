GAMES = {
    "e13c1cfc-f8ed-4ffd-9210-b37751737774": {
        "gameId": "87644",
        "players": {
            "player1": {
                "level": 1,
            }
        },
    }
}


def game_player_exists(game_id: str, player_id: str):
    return game_id in GAMES and player_id in GAMES[game_id]["players"]

def get_player_info(game_id: str, player_id: str):
    return GAMES[game_id]["players"][player_id]

