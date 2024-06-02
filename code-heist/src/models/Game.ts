import Player from "./Player";

interface Game {
    join_key: string;
    status: string;
    created_at: string;
    players: {
        [player_id: string]: Player;
    };
    levels: {
        [level: string]: {
            started_at: string;
            started: boolean;
        };
    }
}

export default Game;
