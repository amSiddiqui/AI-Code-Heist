import Game from "@app/models/Game";
import { Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogTitle, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import GameCard from "./GameCard";
import AdminUpdates from "@app/models/AdminUpdates";
import { useSnackbar } from "notistack";
import Player from "@app/models/Player";


const wsSchema = window.location.protocol === "https:" ? "wss" : "ws";
const wsUrl = `${wsSchema}://${window.location.host}/`;


const AdminWindow = ({
    accessToken,
}: {
    accessToken: string;
}) => {

    const [games, setGames] = useState<Game[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [creatingGame, setCreatingGame] = useState(false);
    const [fetching, setFetching] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const { enqueueSnackbar } = useSnackbar();
    

    const onStartLevel = useCallback((game_key: string, level: string) => {
        fetch('/api/admin/game/start', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ game_key, level }),
        }).then(response => {
            if (!response.ok) {
                enqueueSnackbar('Failed to start level', {
                    variant: 'error',
                });
                console.log('Failed to start level:', response);
            }
        }).catch(err => {
            enqueueSnackbar('Failed to start level', {
                variant: 'error',
            });
            console.log('Failed to start level:', err);
        });
    }, [accessToken, enqueueSnackbar]);

    const onDeactivateGame = useCallback((game_key: string) => {
        fetch('/api/admin/game/deactivate', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ game_key }),
        }).then(response => {
            if (!response.ok) {
                enqueueSnackbar('Failed to deactivate game', {
                    variant: 'error',
                });
                console.log('Failed to deactivate game:', response);
            }
        }).catch(err => {
            console.log('Failed to deactivate game:', err);
        });
    }, [accessToken, enqueueSnackbar]);

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

    const refreshGamePlayer = useCallback((game_key: string, player_id: string) => {
        const params = {
            game_key,
            player_id,
        };

        const base_url = "/api/game";
        const url = new URL(base_url, window.location.origin);
        url.search = new URLSearchParams(params).toString();

        fetch(url).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    const newPlayerInfo: Player = data.player;
                    setGames((games) => {
                        const game = games.find((game) => game.join_key === game_key);
                        if (!game) {
                            return games;
                        }

                        game.players[player_id] = newPlayerInfo;
                        return [...games];
                    });
                });
            } else {
                console.log("Failed to fetch:", response);
            }
        });

    }, []);

    useEffect(() => {
        refreshGames();
    }, [refreshGames]);

    const handlePlayerUpdates = useCallback((data: AdminUpdates) => {
        if (data.action === 'join') {
            if (!data.game_key || !data.player) {
                return;
            }
            setGames((games) => {
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

        if (data.action === 'level_complete') {
            if (data.game_key && data.player_id) {
                refreshGamePlayer(data.game_key, data.player_id);
            }
        }
    }, [refreshGamePlayer]);

    const handleGameUpdates = useCallback((data: AdminUpdates) => {
        if (data.action === 'start') {
            const game_key = data.game_key;
            const level = data.level;
            const started_at = data.started_at;
            if (!game_key || !level || !started_at) {
                return;
            }

            setGames((games) => {
                const game = games.find((game) => game.join_key === game_key);
                if (!game) {
                    return games;
                }
                game.levels[level] = {
                    started_at,
                    started: true,
                };

                return [...games];
            });
        }

        if (data.action === 'deactivate') {
            const game_key = data.game_key;
            if (!game_key) {
                return;
            }

            setGames((games) => {
                // set the status as inactive
                const game = games.find((game) => game.join_key === game_key);
                if (!game) {
                    return games;
                }
                game.status = 'inactive';
                return [...games];
            });
        }

    }, []);


    useEffect(() => {
        const ws = new WebSocket(`${wsUrl}api/ws/admin`);

        ws.onopen = () => {
            console.log("Admin Connected to WS");
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data) as AdminUpdates;
            if (data.type === "player_update") {
                handlePlayerUpdates(data);
            } else if (data.type === "game_update") {
                handleGameUpdates(data);
            }
            console.log("Admin WS Message", data);
        };

        ws.onclose = () => {
            console.log("Admin WS Disconnected");
        };

        ws.onerror = (error) => {
            console.error("Admin WS Error", error);
        };

        return () => {
            if (ws && ws.readyState === ws.OPEN) {
                ws.close();
            }
        };
    }, [handlePlayerUpdates, handleGameUpdates]);




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
                    <Box
                        display={"flex"}
                        sx={{
                            justifyContent: "center",
                            my: 3,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {!fetching && (
                    <Box
                        sx={{
                            my: 3,
                        }}
                    >
                        {games.map((game) => (
                            <GameCard
                                onDeactivateGame={onDeactivateGame}
                                onStartLevel={onStartLevel}
                                key={game.join_key}
                                game={game}
                            />
                        ))}
                    </Box>
                )}
            </Container>

            <Dialog
                fullWidth
                maxWidth={isMobile ? "lg" : "xs"}
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
            >
                <DialogTitle>Create New Game?</DialogTitle>
                <DialogActions>
                    <Button
                        size="small"
                        disabled={creatingGame}
                        color="secondary"
                        onClick={() => setConfirmOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="small"
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
