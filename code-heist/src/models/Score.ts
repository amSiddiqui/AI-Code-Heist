interface Score {
    player_id: string;
    join_key: string;
    score: {
        level: number;
        time: number;
    }
}

export default Score;