import { Box } from "@mui/material";
import "./App.css";
import ChatWindow from "./components/ChatWindow";

function App() {

    return (
        <>
            <Box className="main-layout">
                <Box display={"flex"} flexDirection={"column"}>
                    <Box
                        sx={{
                            height: "70px",
                            position: "fixed",
                            width: "100%",
                            top: 0,
                            zIndex: 1000,
                            backgroundColor: "#3f51b5",
                        }}
                    ></Box>
                    <Box>
                        <ChatWindow />
                    </Box>
                </Box>
            </Box>
        </>
    );
}

export default App;
