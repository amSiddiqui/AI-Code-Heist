import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";

const LoginPrompt = (
    {
        open,
        onLogin,
    }: {
        open: boolean;
        onLogin: (accessToken: string) => void;
    }
) => {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = () => {
        setSubmitting(true);
        setError("");

        fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password }),
        }).then(async (response) => {
            if (response.ok) {
                const data = await response.json();
                const access_token = data.access_token;
                localStorage.setItem('access_token', access_token);
                onLogin(access_token);
            } else {
                setError('Invalid password');
            }
        }).catch(err => {
            console.log('Failed to fetch:', err);
            setError('Failed to fetch');
        }).finally(() => {
            setSubmitting(false);
        });

    };

    return (
        <>
            <Dialog open={open} fullWidth
                maxWidth={isMobile ? "lg" : "xs"}
            >
                <DialogTitle>Admin Login</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        type='password'
                        margin='dense'
                        id='admin-password'
                        label='Password'
                        fullWidth
                        variant='standard'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSubmit();
                            }
                        }}
                        error={!!error}
                        helperText={error}
                    >
                    </TextField>
                </DialogContent>

                <DialogActions>
                    <Button variant='contained' onClick={onSubmit} disabled={submitting} type='button'>Login</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default LoginPrompt;