import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, useMediaQuery, useTheme } from "@mui/material";
import ChatWindow from "../components/ChatWindow";
import ActionBar from "../components/ActionBar";
import React from "react";

import './Game.css';
import Player from "@app/models/Player";


type GID = {
    game_id: string;
    player_id: string;
}

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
    const [ws, setWs] = React.useState<WebSocket | null>(null);

    const [nameInput, setNameInput] = React.useState("");
    const [gameKeyInput, setGameKeyInput] = React.useState("");

    const [nameError, setNameError] = React.useState('');
    const [gameKeyError, setGameKeyError] = React.useState('');

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

    React.useEffect(() => {
        if (ids) {
            const ws = new WebSocket(`ws://localhost:5173/api/ws/player`);

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
                }
            }

            ws.onerror = (error) => {
                console.log(error);
            }

            ws.onclose = () => {
                console.log("Disconnected from server");
            }

            setWs(ws);

            return () => {
                ws.close();
            }
        } else {
            console.log("No ids");
        }
    }, [ids]);

    return (
        <>
            {!player && (
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
                                onChange={(e) => setGameKeyInput(e.target.value)}
                                error={!!gameKeyError}
                                helperText={gameKeyError}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => joinGame()} variant="contained" type="button">
                            Join
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
            {player && (
                <Box className="main-layout">
                    <ActionBar />
                    <ChatWindow />
                </Box>
            )}
        </>
    );
}

export default Game;
