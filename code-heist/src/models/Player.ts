interface Player {
    player_id: string;
    name: string;
    level: number;
    score: {
        [key: number]: number;
    }
}

export default Player;
