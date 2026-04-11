import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context.tsx";
import AuthMediaStack from "../components/auth/AuthMediaStack";

function Kw({ children }) {
  return (
    <span className="font-semibold text-accent [text-shadow:0_0_24px_rgba(230,57,70,0.35)]">
      {children}
    </span>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);

  async function handleLogin(e) {
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
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-light tracking-tight">
                      {showRules ? "How to play" : "Welcome back"}
                    </h1>
                    <p className="mt-2 text-light/80 text-sm">
                      {showRules
                        ? "Quick reference for this version of Coup."
                        : "Sign in to your Coup account"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRules((v) => !v);
                      setError(null);
                    }}
                    className="shrink-0 rounded-lg border border-light/25 bg-contrast/40 px-4 py-2 text-sm font-semibold text-light/95 shadow-md shadow-black/20 backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-contrast/60 hover:text-light focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate"
                  >
                    {showRules ? "Back to sign in" : "Rules"}
                  </button>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {showRules ? (
                    <motion.div
                      key="rules"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="rounded-xl border border-accent/20 bg-gradient-to-b from-accent/[0.08] to-transparent p-6 shadow-inner shadow-black/20 ring-1 ring-light/5"
                    >
                      <p className="mb-5 text-sm leading-relaxed text-light/85">
                        <Kw>Win</Kw> by being the last player with{" "}
                        <Kw>influence</Kw> (face-down roles). Lie, bluff, and
                        call others out—just do not get caught wrong.
                      </p>
                      <ul className="space-y-3.5 text-sm leading-relaxed text-light/90">
                        <li className="flex gap-3">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(230,57,70,0.6)]"
                            aria-hidden
                          />
                          <span>
                            You start with <Kw>2 influence</Kw> and{" "}
                            <Kw>2 coins</Kw>. Losing both cards{" "}
                            <Kw>eliminates</Kw> you.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(230,57,70,0.6)]"
                            aria-hidden
                          />
                          <span>
                            Each turn, take <Kw>one action</Kw>:{" "}
                            <Kw>Income</Kw> (+1), <Kw>Foreign Aid</Kw> (+2,
                            blockable by <Kw>Duke</Kw>), <Kw>Coup</Kw> (pay{" "}
                            <Kw>7 coins</Kw>, target loses influence—no
                            challenge), or claim a role for{" "}
                            <Kw>Tax</Kw> / <Kw>Steal</Kw> /{" "}
                            <Kw>Assassinate</Kw> / <Kw>Exchange</Kw>.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(230,57,70,0.6)]"
                            aria-hidden
                          />
                          <span>
                            <Kw>Assassinate</Kw> costs <Kw>3 coins</Kw> and can
                            be blocked by <Kw>Contessa</Kw>.{" "}
                            <Kw>Steal</Kw> can be blocked by{" "}
                            <Kw>Captain</Kw> or <Kw>Ambassador</Kw>.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(230,57,70,0.6)]"
                            aria-hidden
                          />
                          <span>
                            Anyone may <Kw>challenge</Kw> a claimed role. If
                            the claim was false, that player{" "}
                            <Kw>loses influence</Kw>; if it was true, the
                            challenger loses influence instead and the action
                            (usually) continues.
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(230,57,70,0.6)]"
                            aria-hidden
                          />
                          <span>
                            Roles in the deck: <Kw>Duke</Kw>,{" "}
                            <Kw>Assassin</Kw>, <Kw>Captain</Kw>,{" "}
                            <Kw>Ambassador</Kw>, <Kw>Contessa</Kw>—three of
                            each.
                          </span>
                        </li>
                      </ul>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <form className="space-y-6" onSubmit={handleLogin}>
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
                          type="submit"
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
                    </motion.div>
                  )}
                </AnimatePresence>
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
