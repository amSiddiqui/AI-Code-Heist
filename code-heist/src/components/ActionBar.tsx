import { AppBar, Button, Toolbar, Typography } from "@mui/material";
import CodeInput from "./CodeInput";
import { useState } from "react";

const ActionBar = () => {

    const [open, setOpen] = useState(false);

    const onClose = () => {
        setOpen(false);
    }

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Code Heist
                    </Typography>
                    <Button onClick={() => { setOpen(true); }} variant="outlined" color="inherit">
                        Guess Code
                    </Button>
                </Toolbar>
            </AppBar>
            <CodeInput open={open} onClose={onClose} />
        </>
    );
}

export default ActionBar;