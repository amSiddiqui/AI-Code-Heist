import { Box } from "@mui/material";
import ChatWindow from "../components/ChatWindow";
import ActionBar from "../components/ActionBar";
import React from "react";

import './Game.css';

function Game() {
    React.useEffect(() => {
        fetch("/api/")
            .then((response) => {
                if (response.status === 200) {
                    console.log("Server is alive");
                }
            })
            .catch((error) => {
                console.log("Failed to fetch:", error);
            });
    }, []);

    return (
        <>
            <Box className="main-layout">
                <Box display={"flex"} flexDirection={"column"}>
                    <Box
                        sx={{
                            position: "fixed",
                            width: "100%",
                            top: 0,
                        }}
                    >
                        <ActionBar />
                    </Box>
                    <Box>
                        <ChatWindow />
                    </Box>
                </Box>
            </Box>
        </>
    );
}

export default Game;
