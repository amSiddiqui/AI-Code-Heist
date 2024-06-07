import { AppBar, Box, Button, Container, Dialog, DialogContent, DialogTitle, Drawer, IconButton, Paper, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CodeInput from "./CodeInput";
import { useEffect, useState } from "react";
import Player from "@app/models/Player";
import GameModel from "@app/models/Game";
import SuccessDialog from "./SuccessDialog";
import { calculatePlayerScore, secondsToHourMinuteSecond } from "../services/helper";
import { DrawerList } from "./DrawerItem";

const hasLevelStarted = (game: GameModel, level: number) => 
    game.levels[level.toString()] && game.levels[level.toString()].started;


const ActionBar = ({
    player,
    game,
    onWin
}: {
    player: Player,
    game: GameModel,
    onWin: () => void,
}) => {

    const [drawer, setDrawer] = useState(false);

    const [open, setOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [levelTimer, setLevelTimer] = useState(() => {
        if (!hasLevelStarted(game, player.level)) {
            return 0;
        }
        const startedAt = new Date(game.levels[player.level.toString()].started_at);
        return Math.floor((Date.now() - startedAt.getTime()) / 1000);
    });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const onClose = () => {
        setOpen(false);
    }

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
            event &&
            event.type === "keydown" &&
            ((event as React.KeyboardEvent).key === "Tab" ||
                (event as React.KeyboardEvent).key === "Shift")
        ) {
            return;
        }

        setDrawer(open);
    }

    const onGuessCode = (guess: string) => {
        console.log('Player: ', player);
        fetch('/api/game/guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_id: player.player_id, guess, game_key: game.join_key }),
        }).then(response => {
            if (response.ok) {
                response.json().then(data => {
                    const correct = data.correct;
                    if (correct) {
                        setShowSuccess(true);
                        onClose();
                    } else {
                        setErrorMessage('Incorrect guess. Try again.');
                    }
                });
            } else {
                setErrorMessage('Failed to submit guess');
            }
        }).catch((err) => {
            console.log('Error while submitting guess:', err);
            setErrorMessage('Something went wrong. Failed to submit guess');
        });
    }

    useEffect(() => {
        if (!hasLevelStarted(game, player.level)) {
            return;
        }
        const interval = setInterval(() => {
            setLevelTimer((timer) => timer + 1);
        }, 1000);

        return () => {
            clearInterval(interval);
        }
    }, [game, player.level]);

    return (
        <>
            <AppBar position="sticky">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={toggleDrawer(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Code Heist
                    </Typography>
                    <Button
                        onClick={() => {
                            setOpen(true);
                            setErrorMessage("");
                        }}
                        variant="outlined"
                        color="inherit"
                    >
                        Guess Code
                    </Button>
                </Toolbar>
            </AppBar>
            <Paper>
                <Container
                    sx={{
                        py: 1,
                    }}
                >
                    <Box display={"flex"} alignItems="center">
                        <Box flexGrow={1}>
                            <Typography variant="body1" color="initial">
                                Level {player.level}
                            </Typography>
                            <Typography variant="body2" color="initial">
                                {secondsToHourMinuteSecond(levelTimer)}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="body1" color="initial">
                                {player.name}
                            </Typography>
                            <Typography variant="body2" color="initial">
                                Total Time:{" "}
                                {secondsToHourMinuteSecond(
                                    calculatePlayerScore(player)
                                )}
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Paper>
            <CodeInput
                onGuessCode={onGuessCode}
                open={open}
                onClose={onClose}
                errorMessage={errorMessage}
            />
            {showSuccess && (
                <SuccessDialog
                    open={showSuccess}
                    onNextLevel={() => {
                        setShowSuccess(false);
                        onWin();
                    }}
                />
            )}
            {!hasLevelStarted(game, player.level) && (
                <Dialog open fullWidth maxWidth={isMobile ? "lg" : "md"}>
                    <DialogTitle> Level {player.level}</DialogTitle>
                    <DialogContent>
                        <Typography>Waiting for level to start</Typography>
                    </DialogContent>
                </Dialog>
            )}

            <Drawer open={drawer} onClose={toggleDrawer(false)}>
                <DrawerList toggleDrawer={toggleDrawer} />
            </Drawer>
        </>
    );
}

export default ActionBar;