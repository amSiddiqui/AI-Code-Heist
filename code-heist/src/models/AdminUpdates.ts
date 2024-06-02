import Player from "./Player";

interface AdminUpdates {
    type: 'player_update' | 'game_update';
    action: 'join' | 'start' | 'delete';
    player?: Player;
    game_key: string;
    level?: string,
    started_at?: string,
}

export default AdminUpdates;