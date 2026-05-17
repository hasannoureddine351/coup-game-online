import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import AuthMediaStack from "../components/auth/AuthMediaStack";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, error, setError } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({ username, email, password, confirmPassword });
      navigate("/lobby", { replace: true });
    } catch {
      // Error handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="crt-wrapper min-h-screen flex flex-col bg-cyber-bg relative">
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

                <div className="mb-7">
                  <h1 className="font-pixel text-[11px] text-neon-cyan glow-cyan tracking-widest mb-2">
                    CREATE OPERATOR PROFILE
                  </h1>
                  <p className="font-mono text-[10px] text-white/40 uppercase">
                    Register new operative credentials
                  </p>
                </div>

                <div className="pixel-divider mb-6" />

                <form className="space-y-4" onSubmit={handleSignup}>
                  <div>
                    <label htmlFor="username" className="block font-mono text-[10px] text-neon-cyan/70 uppercase tracking-widest mb-1.5">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="operative-name"
                      required
                      autoComplete="username"
                      className="w-full px-3 py-2.5 bg-cyber-bg border-2 border-cyber-border text-white font-mono text-sm
                        placeholder-white/20 focus:outline-none focus:border-neon-cyan transition-colors"
                      style={{ boxShadow: '2px 2px 0px #000' }}
                    />
                  </div>

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
                    <label htmlFor="password" className="block font-mono text-[10px] text-neon-cyan/70 uppercase tracking-widest mb-1.5">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      minLength={8}
                      className="w-full px-3 py-2.5 bg-cyber-bg border-2 border-cyber-border text-white font-mono text-sm
                        placeholder-white/20 focus:outline-none focus:border-neon-cyan transition-colors"
                      style={{ boxShadow: '2px 2px 0px #000' }}
                    />
                    <p className="mt-1 font-mono text-[9px] text-white/30">Min. 8 characters</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block font-mono text-[10px] text-neon-cyan/70 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      minLength={8}
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
                    onClick={(e) => handleSignup(e)}
                    className="btn-cyan w-full py-3 text-[9px] tracking-widest mt-2"
                  >
                    {isSubmitting ? "CREATING PROFILE..." : "▶ REGISTER OPERATIVE"}
                  </button>
                </form>

                <p className="mt-6 text-center font-mono text-[10px] text-white/40">
                  Already registered?{" "}
                  <Link to="/login" className="text-neon-cyan hover:glow-cyan transition-colors">
                    Access terminal
                  </Link>
                </p>
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
