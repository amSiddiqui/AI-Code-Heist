import { Box, Container, IconButton, Paper, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import React, { useEffect } from "react";
import { useGameContext } from "../services/GameContext";

interface Message {
    id: number;
    message: string;
    user: boolean;
}


const ChatWindow = ({
    level,
}: {
    level: number;
}) => {

    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isMessageStream, setIsMessageStream] = React.useState(false);
    const [userMessage, setUserMessage] = React.useState("");
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    // Create ref to the input field
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const { levelCompleted, clearChat } = useGameContext(); 

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView();
    }

    useEffect(scrollToBottom, [messages]);

    const sendMessage = (message: string) => {
        let newMessages = [
            ...messages,
            { message, user: true, id: messages.length },
        ];
        setMessages(newMessages);
        setIsMessageStream(true);

        const newAIMessage = { message: "", user: false, id: messages.length + 1 };
        newMessages = [...newMessages, newAIMessage];

        setMessages(newMessages);
        
        fetch('/api/stream_chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: newMessages, level }),
        }).then(response => {
            const reader  = response.body?.getReader();
            const decoder = new TextDecoder('utf-8');

            reader?.read().then(function processText({ done, value }) {
                if (done) {
                    inputRef.current?.focus();
                    return;
                }
                const token = decoder.decode(value);
                newAIMessage.message += token;
                setMessages([...newMessages]);
                reader?.read().then(processText);
            });

        }).catch(error => {
            console.log('Failed to fetch:', error);
        }).finally(() => {
            setIsMessageStream(false);
        });
    }

    useEffect(() => {
        setMessages([]);
        setUserMessage("");
        setIsMessageStream(false);
    }, [levelCompleted]);

    useEffect(() => {
        setMessages([]);
    }, [clearChat]);

    return (
        <Box
            display="flex"
            sx={{
                height: "100%",
            }}
            justifyContent="end"
            flexDirection="column"
            gap={1}
        >
            {messages.length > 0 && (
                <Container>
                    <Box
                        sx={{
                            py: "16px",
                            mb: "25px",
                        }}
                        gap={2}
                        display={"flex"}
                        flexDirection={"column"}
                    >
                        {messages.map((message) => {
                            if (message.user) {
                                return (
                                    <UserMessage
                                        key={message.id}
                                        message={message.message}
                                    />
                                );
                            } else {
                                return (
                                    <AIMessage
                                        key={message.id}
                                        message={message.message}
                                    />
                                );
                            }
                        })}
                        <div ref={messagesEndRef}></div>
                    </Box>
                </Container>
            )}
            {messages.length === 0 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        my: 4,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            color: "gray", // TODO: Make this a theme color
                        }}
                    >
                        Say Hi... 👋
                    </Typography>
                </Box>
            )}
            <Box
                sx={{
                    position: "fixed",
                    bottom: 5,
                    width: "100%",
                }}
            >
                <Box
                
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <Paper
                        component="form"
                        sx={{
                            p: "2px 4px",
                            display: "flex",
                            alignItems: "center",
                            width: "85%",
                        }}
                    >
                        <TextField
                            sx={{ flex: 1, ml: "10px" }}
                            placeholder="Ask a question..."
                            inputProps={{
                                "aria-label": "Ask a question...",
                            }}
                            inputRef={inputRef}
                            variant="standard"
                            disabled={isMessageStream}
                            multiline
                            value={userMessage}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                setUserMessage(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    if (userMessage.trim() === "") {
                                        return;
                                    }
                                    sendMessage(userMessage);
                                    setUserMessage("");
                                    e.stopPropagation();
                                }
                            }}
                        />
                        <IconButton
                            type="button"
                            sx={{ p: "10px" }}
                            disabled={isMessageStream}
                            aria-label="search"
                            onClick={() => {
                                if (userMessage.trim() === "") {
                                    return;
                                }
                                sendMessage(userMessage);
                                setUserMessage("");
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}


export default ChatWindow;
