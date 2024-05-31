import Game from "@app/models/Game";
import { Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogTitle, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import GameCard from "./GameCard";


const AdminWindow = ({
    accessToken,
}: {
    accessToken: string;
}) => {

    const [games, setGames] = useState<Game[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [creatingGame, setCreatingGame] = useState(false);
    const [fetching, setFetching] = useState(false);

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
                        <GameCard accessToken={accessToken} key={game.game_id} game={game} />
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
