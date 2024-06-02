import Game from "@app/models/Game";
import { Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogTitle, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import GameCard from "./GameCard";
import AdminUpdates from "@app/models/AdminUpdates";


const AdminWindow = ({
    accessToken,
}: {
    accessToken: string;
}) => {

    const [games, setGames] = useState<Game[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [creatingGame, setCreatingGame] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [ws, setWs] = useState<WebSocket | null>(null);

    const refreshGames = useCallback(() => {
        setFetching(true);
        fetch("/api/admin/games", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        setGames(data);
                    });
                } else {
                    console.log("Failed to fetch:", response);
                }
            })
            .catch((error) => {
                console.log("Failed to fetch:", error);
            })
            .finally(() => {
                setFetching(false);
            });
    }, [accessToken]);

    useEffect(() => {
        refreshGames();
    }, [refreshGames]);

    const handlePlayerUpdates = useCallback((data: AdminUpdates) => {
        if (data.action === 'join') {
            if (!data.game_key || !data.player) {
                return;
            }
            setGames((games) => {
                // find game by game id
                const newPlayer = data.player;
                if (!newPlayer) {
                    return games;
                }
                const game = games.find((game) => game.join_key === data.game_key);
                if (!game) {
                    return games;
                }

                if (!(newPlayer.player_id in game.players)) {
                    game.players[newPlayer.player_id] = newPlayer;
                }

                return [...games];
            });
        }
    }, []);


    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/api/ws/admin");

        ws.onopen = () => {
            console.log("Admin Connected to WS");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data) as AdminUpdates;
            if (data.type === 'player_update') {
                handlePlayerUpdates(data);
            }
        };

        ws.onclose = () => {
            console.log("Admin WS Disconnected");
        };

        ws.onerror = (error) => {
            console.error("Admin WS Error", error);
        };

        setWs(ws);

        return () => {
            if (ws && ws.readyState === ws.OPEN) {
                ws.close();
            }
        };
    }, [handlePlayerUpdates]);




    const onCreateGame = () => {
        setConfirmOpen(false);
        setCreatingGame(true);

        fetch('/api/admin/games', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(response => {
            if (response.ok) {
                refreshGames();

            }
        }).catch(error => {
            console.log('Failed to create game:', error);
        }).finally(() => {
            setCreatingGame(false);
            setConfirmOpen(false);
        });
    }

    return (
        <>
            <Container
                sx={{
                    mt: 4,
                }}
            >
                <Box display={"flex"}>
                    <Typography flexGrow={1} variant="h4" color="initial">
                        All Games
                    </Typography>
                    <Button
                        onClick={() => {
                            setConfirmOpen(true);
                        }}
                        variant="contained"
                    >
                        Create Game
                    </Button>
                </Box>
                
                {fetching && (
                    <Box display={'flex'}
                        sx={{
                            justifyContent: 'center',
                            my: 3,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {!fetching && <Box
                    sx={{
                        my: 3,
                    }}
                >
                    {games.map((game) => (
                        <GameCard key={game.join_key} game={game} />
                    ))}
                </Box>}
            </Container>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Create New Game?</DialogTitle>
                <DialogActions>
                    <Button
                        disabled={creatingGame}
                        color="secondary"
                        onClick={() => setConfirmOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={creatingGame}
                        color="success"
                        variant="contained"
                        onClick={onCreateGame}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default AdminWindow;
