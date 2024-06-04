import { Box, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import React from "react";
import MailIcon from "@mui/icons-material/Mail";
import CloseIcon from "@mui/icons-material/Close";

type DrawerListProps = {
    toggleDrawer: (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => void;
}

export const DrawerList: React.FC<DrawerListProps> = ({ toggleDrawer }) => {
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
                            <ListItemButton>
                                <ListItemIcon>
                                    <MailIcon />
                                </ListItemIcon>
                                <ListItemText primary={"Send"} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
                <Box sx={{
                    mt: 1
                }}>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={toggleDrawer(false)}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}