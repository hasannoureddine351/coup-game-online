import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

window.Pusher = Pusher;

export const initEcho = (token: string): Echo<any> => {
  return new Echo({
    broadcaster: 'reverb',
    key: 'local-key',
    wsHost: '127.0.0.1',
    wsPort: 8080,
    wssPort: 8080,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: 'http://localhost:8000/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};

export const disconnectEcho = (echo: Echo<any> | null) => {
  if (echo) {
    echo.disconnect();
  }
};
