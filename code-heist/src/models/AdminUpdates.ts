import Player from "./Player";

interface AdminUpdates {
    type: 'player_update' | 'game_update';
    action: string;
    player?: Player;
    game_key: string;
}

export default AdminUpdates;