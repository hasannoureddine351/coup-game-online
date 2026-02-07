import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context.tsx";
import AuthMediaStack from "../components/auth/AuthMediaStack";
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/lobby", { replace: true });
    } catch {
      // Error handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  };


  async function handleLogin (e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/lobby", { replace: true });
    } catch {
      // Error handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate">
      <p className="font-gothic text-center text-3xl md:text-4xl font-black tracking-widest text-light/95 drop-shadow-md pt-8 md:pt-10">
        COUP
      </p>
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-stretch">
          {/* Form card (left on desktop) */}
          <div className="flex justify-center items-center order-2 md:order-1 min-h-[50vh] md:min-h-0">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-lg h-full flex items-center"
            >
              <div className="w-full p-10 md:p-14">
                <div className="mb-10">
                  <h1 className="text-2xl md:text-3xl font-bold text-light tracking-tight">
                    Welcome back
                  </h1>
                  <p className="mt-2 text-light/80 text-sm">
                    Sign in to your Coup account
                  </p>
                </div>

                <form className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-light mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-2 rounded-md bg-accent/30 border border-accent/30 text-light placeholder-light/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-light"
                      >
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-accent hover:text-light transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full px-4 py-2 rounded-md bg-accent/30 border border-accent/30 text-light placeholder-light/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-300" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={(e) => handleLogin(e)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-md bg-accent hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate transition-all duration-200 active:scale-[0.99]"
                  >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-light/80">
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-medium text-accent hover:text-light transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>

          {/* How to play video + actions summary stack (toggle on desktop, swipe on mobile) */}
          <div className="flex justify-center items-center order-1 md:order-2 min-h-[320px] md:min-h-0 w-full">
            <AuthMediaStack />
          </div>
        </div>
      </div>
    </div>
  );
}
