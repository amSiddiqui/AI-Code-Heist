import { Paper, Typography } from "@mui/material";

const UserMessage = ({ message }: { message: string }) => {
    return (
        <Paper
            sx={{
                p: "15px",
                ml: "15px",
                backgroundColor: "#EAF4E2",
                borderRadius: "20px 0 20px 20px",
            }}
        >
            <Typography variant="body1" color="initial">
                {message}
            </Typography>
        </Paper>
    );
}

export default UserMessage;