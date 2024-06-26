import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, useMediaQuery, useTheme, Typography } from "@mui/material";
import ChatWindow from "../components/ChatWindow";
import ActionBar from "../components/ActionBar";
import React, { useCallback } from "react";

import './Game.css';
import Player from "@app/models/Player";
import GameModel from "@app/models/Game";
import AdminUpdates from "@app/models/AdminUpdates";
import { useGameContext } from "../services/GameContext";

type GID = {
    game_id: string;
    player_id: string;
}

const wsSchema = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${wsSchema}://${window.location.host}/`;

function Game() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [ids, setIds] = React.useState<GID| null>(() => {
        const ids = localStorage.getItem("game_player_id");
        if (ids) {
            return JSON.parse(ids);
        }
        return null;
    });

    const [player, setPlayer] = React.useState<Player | null>(null);
    const [game, setGame] = React.useState<GameModel | null>(null);

    const [nameInput, setNameInput] = React.useState("");
    const [gameKeyInput, setGameKeyInput] = React.useState("");

    const [nameError, setNameError] = React.useState('');
    const [gameKeyError, setGameKeyError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [gameLoadError, setGameLoadError] = React.useState('');

    const { handleLevelComplete } = useGameContext();

    const onWin = () => {
        console.log('Win');
        refreshPlayerAndGame();
        handleLevelComplete();
    }

    const refreshPlayerAndGame = () => {
        if (!game || !player) {
            return;
        }
        const params = {
            game_key: game.join_key,
            player_id: player.player_id,
        }

        const base_url = '/api/game';
        const url = new URL(base_url, window.location.origin);
        url.search = new URLSearchParams(params).toString();
        fetch(url).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    setPlayer(data.player);
                    setGame(data.game);
                });
            } else {
                console.log('Failed to fetch:', response);
            }
        }).catch(err => {
            console.log('Failed to fetch:', err);
        });
    }

    const joinGame = () => {
        setNameError('');
        setGameKeyError('');
        const ni = nameInput.trim();
        const gki = gameKeyInput.trim();
        if (!ni) {
            setNameError("Name is required");
        }
        if (!gki) {
            setGameKeyError("Game Key is required");
        }
        if (!ni || !gki) {
            return;
        }

        fetch('/api/game/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_name: ni, game_key: gki }),
        }).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    localStorage.setItem("game_player_id", JSON.stringify(data));
                    setIds(data);
                });
            } else {
                if (response.status === 404) {
                    setGameKeyError("Game not found");
                } else if (response.status === 400) {
                    setNameError("Name already taken");
                } else {
                    setNameError("An error occurred");
                }
            }
        }).catch(error => {
            console.log('Failed to fetch:', error);
            setNameError("An error occurred");
        });
    }


    const handleGameUpdates = useCallback((data: AdminUpdates) => {
        if (data.action === "start") {
            const game_key = data.game_key;
            const level = data.level;
            const started_at = data.started_at;
            if (!game_key || !level || !started_at) {
                return;
            }
            setGame((game) => {
                if (!game) {
                    return game;
                }

                if (game_key !== game.join_key) {
                    return game;
                } 

                const newGame = { ...game };
                newGame.levels[level] = {
                    started_at,
                    started: true,
                };
                return newGame;
            });
        }

        if (data.action === 'delete' || data.action === 'deactivate') {
            const game_key = data.game_key;
            if (!game_key) {
                return;
            }
            setGame((game) => {
                if (!game) {
                    return game;
                }

                if (game_key !== game.join_key) {
                    return game;
                }

                setPlayer(null);
                return null;
            });
        }
    }, []);


    React.useEffect(() => {
        if (ids) {
            setLoading(true);
            setGameLoadError('');
            const ws = new WebSocket(`${wsUrl}api/ws/player`);

            ws.onopen = () => {
                console.log('Connection open sending connect message ', ids);
                ws.send(JSON.stringify({
                    type: "connect",
                    game_id: ids.game_id,
                    player_id: ids.player_id
                }));
                console.log("Connected to server");
            }

            ws.onmessage = (message) => {
                const data = JSON.parse(message.data);
                console.log('Message received: ', data);
                if (data.type === 'connect') {
                    setPlayer(data.player);
                    setGame(data.game);
                }
                if (data.type === 'game_update') {
                    handleGameUpdates(data);
                }
                setLoading(false);
                setGameLoadError('');
            }

            ws.onerror = (error) => {
                console.log(error);
            }

            ws.onclose = () => {
                console.log("Disconnected from server");
            }

            return () => {
                ws.close();
            }
        } else {
            console.log("No ids");
        }
    }, [ids, handleGameUpdates]);

    return (
        <>
            {!player && !loading && !gameLoadError && (
                <Dialog open fullWidth maxWidth={isMobile ? "lg" : "sm"}>
                    <DialogTitle>Join Game</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2}>
                            <TextField
                                variant="standard"
                                fullWidth
                                label="Name"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                error={!!nameError}
                                helperText={nameError}
                            />
                            <TextField
                                variant="standard"
                                fullWidth
                                label="Game Key"
                                value={gameKeyInput}
                                onChange={(e) =>
                                    setGameKeyInput(e.target.value)
                                }
                                error={!!gameKeyError}
                                helperText={gameKeyError}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            size="small"
                            onClick={() => joinGame()}
                            variant="contained"
                            type="button"
                        >
                            Join
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
            {player && game && !gameLoadError && (
                <Box className="main-layout">
                    <ActionBar onWin={onWin} player={player} game={game} />
                    <ChatWindow level={player.level} game_key={game.join_key} />
                </Box>
            )}
            {loading && !gameLoadError && (
                <Dialog open fullWidth maxWidth={isMobile ? "lg" : "sm"}>
                    <DialogContent>
                        <Box display="flex" justifyContent="center">
                            <CircularProgress />
                        </Box>
                    </DialogContent>
                </Dialog>
            )}

            {gameLoadError && (
                <Dialog open fullWidth maxWidth={isMobile ? "md" : "sm"}>
                    <DialogTitle color="error">Error</DialogTitle>
                    <DialogContent>
                        <Box display="flex" justifyContent="center">
                            <Typography variant="body1" color="initial">
                                {gameLoadError}
                            </Typography>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

export default Game;
