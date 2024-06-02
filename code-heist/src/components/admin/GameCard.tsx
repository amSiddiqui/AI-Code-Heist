import Game from "@app/models/Game";
import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Button, Chip, Dialog, DialogActions, DialogTitle, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { useState } from "react";


const formatISODate = (isoDate: string) => {
    if (!isoDate)
        return '';
    const date = new Date(isoDate);
    return date.toLocaleString();
}

const GameCard = ({
    game,
    onStartLevel,
    onDeleteGame
}: {
    game: Game,
    onStartLevel: (game_key: string, level: string) => void,
    onDeleteGame: (game_key: string) => void
}) => {
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

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
                                game.status === "active"
                                    ? "success"
                                    : "secondary"
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
                                        {Object.entries(game.players).map(
                                            ([player_id, player]) => (
                                                <TableRow key={player_id}>
                                                    <TableCell>
                                                        {player.name}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {player.level}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {Object.values(
                                                            player.score
                                                        ).reduce(
                                                            (acc, val) =>
                                                                acc + val,
                                                            0
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
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
                    <Button color="error" size="small" onClick={
                        () => {
                            setShowDeleteConfirmModal(true);
                        }
                    }>
                        Delete
                    </Button>
                </AccordionActions>
            </Accordion>

            <Dialog open={showDeleteConfirmModal} onClose={
                () => {
                    setShowDeleteConfirmModal(false);
                }
            }>
                <DialogTitle>Delete Game?</DialogTitle>
                <DialogActions>
                    <Button
                        color="secondary"
                        onClick={() => {
                            setShowDeleteConfirmModal(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {
                            onDeleteGame(game.join_key);
                            setShowDeleteConfirmModal(false);
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default GameCard;