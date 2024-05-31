interface Score {
    player_id: string;
    game_id: string;
    score: {
        level: number;
        time: number;
    }
}

export default Score;