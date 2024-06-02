import Game from "@app/models/Game";
import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { useState } from "react";


const formatISODate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
}

const GameCard = ({
    game
}: {
    game: Game
}) => {
    const [tab, setTab] = useState(0);
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display={'flex'} sx={{
                    gap: 2,
                    alignItems: 'center',
                }}>
                    <Typography variant="h6" color="initial">
                        {game.join_key}
                    </Typography>
                    <Chip
                    size='small'
                        label={game.status.toLocaleUpperCase()}
                        color={
                            game.status === "active" ? "success" : "secondary"
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
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(game.players).map(([player_id, player]) => (
                                        <TableRow key={player_id}>
                                            <TableCell>{player.name}</TableCell>
                                            <TableCell align="right">
                                                {player.level}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                    <Box hidden={tab !== 1}>
                        <Typography variant="h6">Levels</Typography>
                    </Box>
                </Stack>
            </AccordionDetails>
        </Accordion>
    );
}

export default GameCard;