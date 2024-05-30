import React from 'react';
import './Admin.css';
import Container from '@mui/material/Container'
import LoginPrompt from '../components/admin/LoginPrompt';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [accessToken, setAccessToken] = React.useState(() => {
        return localStorage.getItem('access_token');
    });

    React.useEffect(() => {
        fetch('/api/admin', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then(response => {
            if (response.ok) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                console.log('Failed to fetch:', response);
            }
        }).catch(error => {
            console.log('Failed to fetch:', error);
            setIsAuthenticated(false);
        });
    }, [accessToken]);


    return (
        <>
            <Container maxWidth="lg">
            </Container>
            <LoginPrompt open={!isAuthenticated} onLogin={(token) => {
                setAccessToken(token);
            }} />
        </>
    );
}

export default Admin;