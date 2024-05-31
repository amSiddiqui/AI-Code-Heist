import Game from "@app/models/Game";
import Player from "@app/models/Player";
import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { useEffect, useState } from "react";


const formatISODate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString();
}

const GameCard = ({
    game,
    accessToken,
}: {
    game: Game,
    accessToken: string,
}) => {

    const [tab, setTab] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        fetch(`/api/admin/games/${game.game_id}/players`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(response => {
            if (response.ok) {
                response.json().then((data) => {
                    setPlayers(data);
                });
            } else {
                console.log('Failed to fetch:', response);
            }
        }).catch(error => {
            console.log('Failed to fetch:', error);
        });
    }, [accessToken, game]);


    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" color="initial">
                    {game.join_key}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Stack spacing={2}>
                    <Box display={"flex"}>
                        <Typography
                            variant="body1"
                            color="initial"
                            flexGrow={1}
                            sx={{
                                textTransform: "capitalize",
                            }}
                        >
                            {game.status}
                        </Typography>
                        <Typography variant="body1" color="initial">
                            {game.game_id}
                        </Typography>
                    </Box>
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
                            id={`game-tab-${game.game_id}-1`}
                        ></Tab>
                    </Tabs>
                    <Box hidden={tab !== 0}>
                        <Typography variant="h6">Players</Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell align='right'>Level</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {players.map((player) => (
                                        <TableRow key={player.player_id}>
                                            <TableCell>{player.name}</TableCell>
                                            <TableCell align="right">{player.level}</TableCell>
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