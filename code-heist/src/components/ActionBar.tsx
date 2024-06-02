import { AppBar, Box, Button, Container, Dialog, DialogContent, DialogTitle, Paper, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import CodeInput from "./CodeInput";
import { useEffect, useState } from "react";
import Player from "@app/models/Player";
import GameModel from "@app/models/Game";


const calculatePlayerScore = (player: Player) => 
    Object.values(player.score).reduce((acc, val) => acc + val, 0)

const hasLevelStarted = (game: GameModel, level: number) => 
    game.levels[level.toString()] && game.levels[level.toString()].started;

const secondsToHourMinuteSecond = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    // only show number if greater than 0
    return `${h > 0 ? h + 'h' : ''} ${m > 0 ? m + 'm' : ''} ${s > 0 ? s + 's' : ''}`;
}

const ActionBar = ({
    player,
    game
}: {
    player: Player,
    game: GameModel
}) => {

    const [open, setOpen] = useState(false);
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
                                Score: {calculatePlayerScore(player)}
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Paper>
            <CodeInput open={open} onClose={onClose} />
            {!hasLevelStarted(game, player.level) && (
                <Dialog open fullWidth maxWidth={isMobile ? "lg" : "md"}>
                    <DialogTitle> Level {player.level}</DialogTitle>
                    <DialogContent>
                        <Typography>Waiting for level to start</Typography>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

export default ActionBar;