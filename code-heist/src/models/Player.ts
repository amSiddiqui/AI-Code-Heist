interface Player {
    player_id: string;
    join_key: string;
    name: string;
    level: number;
    score: {
        [key: number]: number;
    }
}

export default Player;
