import { Box, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useGameContext } from "../services/GameContext";

type DrawerListProps = {
    toggleDrawer: (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => void;
}

export const DrawerList: React.FC<DrawerListProps> = ({ toggleDrawer }) => {
    const { handleClearChat } = useGameContext();
    
    return (
        <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
        >
            <Box
                sx={{
                    width: "100%",
                }}
                display={"flex"}
            >
                <Box flexGrow={1}>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => {handleClearChat();}}>
                                <ListItemIcon>
                                    <ClearAllIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Clear Chat"} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
                <Box
                    sx={{
                        mt: 1,
                    }}
                >
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={toggleDrawer(false)}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}