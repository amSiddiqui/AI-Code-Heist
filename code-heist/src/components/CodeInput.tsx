import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

const CodeInput = ({
    open,
    onClose,
    errorMessage,
    onGuessCode,
}: {
    open: boolean;
    errorMessage: string;
    onClose: () => void;
    onGuessCode: (guess: string) => void;
}) => {


    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = () => {
        setSubmitting(true);
        onGuessCode(code);
        setSubmitting(false);
    }

    return (
        <>
            <Dialog
                open={open}
                fullWidth
                onClose={onClose}
                maxWidth={ isMobile ? "lg" : "sm" }
            >
                <DialogTitle>Guess the code</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="code"
                        name="code"
                        label="Super secret code..."
                        type="text"
                        fullWidth
                        variant="standard"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={submitting}
                        error={!!errorMessage}
                        helperText={errorMessage}
                    >
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} type="button">Close</Button>
                    <Button variant="contained" onClick={onSubmit} disabled={submitting} type="button">Guess</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default CodeInput;