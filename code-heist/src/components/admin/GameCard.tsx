import Game from "@app/models/Game";
import { calculatePlayerScore, formatISODate, secondsToHourMinuteSecond } from "../../services/helper";
import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, Chip, Dialog, DialogActions, DialogTitle, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import Player from "@app/models/Player";


const sortPlayers = (players: {[player_id: string]: Player}) => {
    // sort by Player level and if player level is same then sort by score
    return Object.values(players).sort((a, b) => {
        if (a.level === b.level) {
            return  calculatePlayerScore(a) - calculatePlayerScore(b);
        }
        return b.level - a.level;
    });
}

const GameCard = ({
    game,
    onStartLevel,
    onDeactivateGame
}: {
    game: Game,
    onStartLevel: (game_key: string, level: string) => void,
    onDeactivateGame: (game_key: string) => void
}) => {
    const [showDeactivateConfirmModal, setShowDeactivateConfirmModal] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [tab, setTab] = useState(0);
    return (
        <>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box
                        display={"flex"}
                        sx={{
                            gap: 2,
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h6" color="initial">
                            {game.join_key}
                        </Typography>
                        <Chip
                            size="small"
                            label={game.status.toLocaleUpperCase()}
                            color={
                                game.status === "active" ? "success" : undefined
                            }
                        />
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack spacing={2}>
                        <Box>{formatISODate(game.created_at)}</Box>
                        <Tabs
                            value={tab}
                            onChange={(_e, value: number) => {
                                setTab(value);
                            }}
                        >
                            <Tab label="Players"></Tab>
                            <Tab
                                label="Levels"
                                id={`game-tab-${game.join_key}-1`}
                            ></Tab>
                        </Tabs>
                        <Box hidden={tab !== 0}>
                            <Typography variant="h6">Players</Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell align="right">
                                                Level
                                            </TableCell>
                                            <TableCell align="right">
                                                Score
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(
                                            sortPlayers(game.players)
                                        ).map(([player_id, player], index) => (
                                            <TableRow key={player_id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    {player.name}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {player.level}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {secondsToHourMinuteSecond(
                                                        calculatePlayerScore(
                                                            player
                                                        )
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                        <Box hidden={tab !== 1}>
                            <Typography variant="h6">Levels</Typography>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Level</TableCell>
                                            <TableCell align="right">
                                                Started At
                                            </TableCell>
                                            <TableCell align="right">
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(game.levels).map(
                                            ([level, info]) => (
                                                <TableRow key={level}>
                                                    <TableCell>
                                                        {level}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {formatISODate(
                                                            info.started_at
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {!info.started && (
                                                            <Button
                                                                onClick={() => {
                                                                    onStartLevel(
                                                                        game.join_key,
                                                                        level
                                                                    );
                                                                }}
                                                            >
                                                                Start
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Stack>
                </AccordionDetails>
                <AccordionActions>
                    {game.status === "active" && (
                        <Button
                            color="error"
                            size="small"
                            onClick={() => {
                                setShowDeactivateConfirmModal(true);
                            }}
                        >
                            Deactivate
                        </Button>
                    )}
                </AccordionActions>
            </Accordion>

            <Dialog
                fullWidth
                maxWidth={isMobile ? "lg" : "xs"}
                open={showDeactivateConfirmModal}
                onClose={() => {
                    setShowDeactivateConfirmModal(false);
                }}
            >
                <DialogTitle>Deactivate Game?</DialogTitle>
                <DialogActions>
                    <Button
                        size="small"
                        color="secondary"
                        onClick={() => {
                            setShowDeactivateConfirmModal(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={() => {
                            onDeactivateGame(game.join_key);
                            setShowDeactivateConfirmModal(false);
                        }}
                    >
                        Deactivate
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default GameCard;