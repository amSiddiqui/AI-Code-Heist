import Player from "./Player";

interface Game {
    join_key: string;
    status: string;
    created_at: string;
    players: {
        [player_id: string]: Player;
    };
}

export default Game;
