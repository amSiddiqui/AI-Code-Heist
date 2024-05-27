import { Paper, Typography } from "@mui/material";

const AIMessage = ({ message }: { message: string }) => {
    return (
        <Paper
            sx={{
                p: "15px",
                mr: "15px",
                borderRadius: "0 20px 20px 20px",
            }}
        >
            <Typography variant="body1" color="initial">
                {message}
            </Typography>
        </Paper>
    );
}

export default AIMessage;