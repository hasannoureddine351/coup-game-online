import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission handled elsewhere
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-coup-darker via-coup-dark to-coup-darker px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-coup-dark/80 backdrop-blur-xl shadow-2xl shadow-black/40 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-white/50 text-sm">
              Sign in to your Coup account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-1.5"
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-coup-gold/60 focus:border-coup-gold/50 transition-all duration-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/80"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-coup-gold/80 hover:text-coup-gold transition-colors"
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
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-coup-gold/60 focus:border-coup-gold/50 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-coup-red hover:bg-coup-red/90 text-white font-semibold shadow-lg shadow-coup-red/20 hover:shadow-coup-red/30 focus:outline-none focus:ring-2 focus:ring-coup-red focus:ring-offset-2 focus:ring-offset-coup-dark transition-all duration-200 active:scale-[0.99]"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-coup-gold hover:text-coup-gold/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
