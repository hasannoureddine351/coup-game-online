import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import AuthMediaStack from "../components/auth/AuthMediaStack";

function RuleKw({ children }) {
  return (
    <span className="font-bold text-neon-cyan" style={{ textShadow: '0 0 8px rgba(0,240,255,0.5)' }}>
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
    <div className="crt-wrapper min-h-screen flex flex-col bg-cyber-bg">
      {/* Title bar */}
      <div className="text-center pt-8 md:pt-10 pb-2">
        <p className="font-pixel text-neon-cyan text-xl md:text-2xl glow-cyan tracking-widest">
          COUP
        </p>
        <p className="font-mono text-[9px] text-neon-cyan/40 tracking-widest mt-1">
          16-BIT CYBERPUNK TERMINAL · v1.0
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">

          {/* Form panel */}
          <div className="flex justify-center items-center order-2 md:order-1 min-h-[50vh] md:min-h-0">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="w-full max-w-lg"
            >
              <div
                className="bg-cyber-panel border-2 border-neon-cyan p-8 md:p-10 relative"
                style={{ boxShadow: '6px 6px 0px #000, 0 0 20px rgba(0,240,255,0.08)' }}
              >
                {/* Corner decorations */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-neon-cyan/60" />
                <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-neon-cyan/60" />
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-neon-cyan/60" />
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-neon-cyan/60" />

                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="font-pixel text-[11px] text-neon-cyan glow-cyan tracking-widest mb-2">
                      {showRules ? "RULES DATABASE" : "ACCESS TERMINAL"}
                    </h1>
                    <p className="font-mono text-[10px] text-white/40 uppercase">
                      {showRules
                        ? "Quick reference — Coup protocol v1.0"
                        : "Enter credentials to proceed"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowRules((v) => !v); setError(null); }}
                    className="btn-cyan shrink-0 px-4 py-2 text-[8px] tracking-widest"
                  >
                    {showRules ? "← BACK" : "RULES"}
                  </button>
                </div>

                <div className="pixel-divider mb-6" />

                <AnimatePresence mode="wait" initial={false}>
                  {showRules ? (
                    <motion.div
                      key="rules"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="bg-cyber-bg border border-neon-cyan/20 p-4"
                      style={{ boxShadow: '2px 2px 0px #000' }}
                    >
                      <p className="font-mono text-[10px] text-white/70 leading-relaxed mb-4">
                        <RuleKw>Win</RuleKw> by being the last player with{" "}
                        <RuleKw>influence</RuleKw> (face-down roles). Lie, bluff, and
                        call others out — just don't get caught wrong.
                      </p>
                      <ul className="space-y-3">
                        {[
                          <>You start with <RuleKw>2 influence</RuleKw> and <RuleKw>2 coins</RuleKw>. Losing both cards <RuleKw>eliminates</RuleKw> you.</>,
                          <>Each turn: <RuleKw>Income</RuleKw> (+1), <RuleKw>Foreign Aid</RuleKw> (+2, blockable by <RuleKw>Duke</RuleKw>), <RuleKw>Coup</RuleKw> (pay <RuleKw>7 coins</RuleKw>), or claim a role for <RuleKw>Tax</RuleKw> / <RuleKw>Steal</RuleKw> / <RuleKw>Assassinate</RuleKw> / <RuleKw>Exchange</RuleKw>.</>,
                          <><RuleKw>Assassinate</RuleKw> costs <RuleKw>3 coins</RuleKw>, blocked by <RuleKw>Contessa</RuleKw>. <RuleKw>Steal</RuleKw> blocked by <RuleKw>Captain</RuleKw> or <RuleKw>Ambassador</RuleKw>.</>,
                          <>Anyone may <RuleKw>challenge</RuleKw> a claimed role. False claim = lose influence; true claim = challenger loses instead.</>,
                          <>Roles: <RuleKw>Duke</RuleKw>, <RuleKw>Assassin</RuleKw>, <RuleKw>Captain</RuleKw>, <RuleKw>Ambassador</RuleKw>, <RuleKw>Contessa</RuleKw> — three of each.</>,
                        ].map((rule, i) => (
                          <li key={i} className="flex gap-3">
                            <span className="font-pixel text-[8px] text-neon-cyan shrink-0 mt-0.5">▸</span>
                            <span className="font-mono text-[10px] text-white/70 leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                          <label htmlFor="email" className="block font-mono text-[10px] text-neon-cyan/70 uppercase tracking-widest mb-1.5">
                            Email
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="operator@corp.net"
                            required
                            autoComplete="email"
                            className="w-full px-3 py-2.5 bg-cyber-bg border-2 border-cyber-border text-white font-mono text-sm
                              placeholder-white/20 focus:outline-none focus:border-neon-cyan transition-colors"
                            style={{ boxShadow: '2px 2px 0px #000' }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="password" className="block font-mono text-[10px] text-neon-cyan/70 uppercase tracking-widest">
                              Password
                            </label>
                            <Link
                              to="/forgot-password"
                              className="font-mono text-[9px] text-neon-cyan/50 hover:text-neon-cyan transition-colors"
                            >
                              Forgot?
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
                            className="w-full px-3 py-2.5 bg-cyber-bg border-2 border-cyber-border text-white font-mono text-sm
                              placeholder-white/20 focus:outline-none focus:border-neon-cyan transition-colors"
                            style={{ boxShadow: '2px 2px 0px #000' }}
                          />
                        </div>

                        {error && (
                          <p className="font-mono text-[10px] text-neon-red glow-red border border-neon-red/30 px-3 py-2 bg-neon-red/5" role="alert">
                            ⚠ {error}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-cyan w-full py-3 text-[9px] tracking-widest mt-2"
                        >
                          {isSubmitting ? "AUTHENTICATING..." : "▶ ACCESS SYSTEM"}
                        </button>
                      </form>

                      <p className="mt-6 text-center font-mono text-[10px] text-white/40">
                        No account?{" "}
                        <Link to="/signup" className="text-neon-cyan hover:glow-cyan transition-colors">
                          Create operator profile
                        </Link>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Video panel */}
          <div className="flex justify-center items-center order-1 md:order-2 min-h-[280px] md:min-h-0 w-full">
            <AuthMediaStack />
          </div>
        </div>
      </div>
    </div>
  );
}
