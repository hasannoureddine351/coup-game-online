import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/auth-context';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PrivateRoute from './components/auth/PrivateRoute';
import LobbyListPage from './pages/LobbyListPage';
import LobbyRoomPage from './pages/LobbyRoomPage';
import GamePage from './pages/GamePage';




const router = createBrowserRouter([

  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/",
    element: <PrivateRoute/>,
    children: [
      { index: true, element: <Navigate to="/lobby" replace /> },
      { path: "lobby", element: <LobbyListPage /> },
      { path: "lobby/:id", element: <LobbyRoomPage /> },
      { path: "game", element: <GamePage /> },
    ],
  },

]);

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

reportWebVitals();
