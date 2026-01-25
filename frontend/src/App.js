import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-coup-darker via-coup-dark to-coup-darker">
              <h1 className="text-2xl font-bold text-white">Coup</h1>
              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-coup-red hover:bg-coup-red/90 text-white font-semibold transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-3 rounded-xl bg-coup-gold hover:bg-coup-gold/90 text-coup-darker font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
