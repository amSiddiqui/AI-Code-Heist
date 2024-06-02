import { Button, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery, useTheme } from "@mui/material";

type Props = {
    open: boolean;
    onNextLevel: () => void;
}


import confetti from "canvas-confetti";
import { useEffect } from "react";

const fireConfetti = () => {
    confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        zIndex: 2000,
    });
    confetti({
        particleCount: 10,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        zIndex: 2000,
    });
};


const SuccessDialog = ({ open, onNextLevel }: Props) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    useEffect(() => {
        fireConfetti();
    }, []);
    return (
        <Dialog open={open} fullWidth maxWidth={isMobile ? "lg" : "sm"}>
            <DialogTitle>Correct!</DialogTitle>
            <DialogContent>🎉 You cracked the code! 🎉</DialogContent>
            <DialogActions>
                <Button
                    onClick={onNextLevel}
                    color="success"
                    variant="contained"
                    size="small"
                >
                    Next Level
                </Button>
            </DialogActions>
        </Dialog>
    );
};


export default SuccessDialog;