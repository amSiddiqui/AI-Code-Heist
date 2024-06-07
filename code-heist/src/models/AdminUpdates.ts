import Player from "./Player";

interface AdminUpdates {
    type: 'player_update' | 'game_update';
    action: 'join' | 'start' | 'delete' | 'level_complete' | 'deactivate';
    player?: Player;
    player_id?: string;
    game_key: string;
    level?: string,
    started_at?: string,
}

export default AdminUpdates;