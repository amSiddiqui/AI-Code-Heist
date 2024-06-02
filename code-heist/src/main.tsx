import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Game from './pages/Game';
import Admin from './pages/Admin';
import { SnackbarProvider } from 'notistack';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Game />,
  },
  {
    path: '/admin',
    element: <Admin />,
  }
])

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <SnackbarProvider maxSnack={3} >
            <RouterProvider router={router} />
        </SnackbarProvider>
    </React.StrictMode>
);
