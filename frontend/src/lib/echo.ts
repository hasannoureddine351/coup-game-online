import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

const WS_HOST = process.env.REACT_APP_WS_HOST!;
const WS_PORT = Number(process.env.REACT_APP_WS_PORT);

const API_BASE = process.env.REACT_APP_API_URL!;
// IMPORTANT: should be http://13.51.234.165/coup

export const initEcho = (token: string): Echo<any> => {
  return new Echo({
    broadcaster: 'reverb',
    key: process.env.REACT_APP_WS_KEY,

    wsHost: WS_HOST,
    wsPort: WS_PORT,
    wssPort: WS_PORT,

    forceTLS: false,
    enabledTransports: ['ws', 'wss'],

    authEndpoint: `${API_BASE}/broadcasting/auth`,

    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};

export const disconnectEcho = (echo: Echo<any> | null) => {
  if (echo) echo.disconnect();
};



