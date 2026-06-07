import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, X } from "lucide-react";
import AppNav from "../components/layout/AppNav";
import { useAuth } from "../contexts/auth-context";
import type { Game } from "../api/types";
import { useGameData } from "../hooks/useGameData";

export default function LobbyListPage() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const {
    useGameListQuery,
    useCurrentGameQuery,
    createGame,
    joinGame,
    leaveGame,
    deleteGame,
  } = useGameData();

  const { data, isLoading } = useGameListQuery({ status: "waiting" });
  const games: Game[] = Array.isArray(data) ? data : [];
  const { data: inGame = null } = useCurrentGameQuery();

  const handleCreateGame = () =>
    createGame.mutate(undefined, {
      onSuccess: (game) => navigate(`/lobby/${game.id}`, { replace: true }),
    });

  const handleJoinGame = (gameId: number) =>
    joinGame.mutate(gameId, {
      onSuccess: (game) => {
        const id = game != null && typeof game.id === "number" ? game.id : gameId;
        navigate(`/lobby/${id}`, { replace: true });
      },
    });

  const handleLeaveGame = (gameId: number) =>
    leaveGame.mutate(gameId, {
      onSuccess: () => navigate("/lobby", { replace: true }),
    });

  const handleDeleteGame = (gameId: number) => deleteGame.mutate(gameId);

  const isCreating = createGame.isPending;
  const joiningId = joinGame.variables ?? null;

  const playerCount = (g: Game) => g.players?.length ?? 0;
  const hasActiveGame = inGame != null && Object.keys(inGame).length > 0;
  const hasWaitingGame = hasActiveGame && (inGame as Game)?.status === "waiting";
  const currentGameInList = games.some((g) => g.id === (inGame as Game)?.id);
  const showCurrentGameCard = hasActiveGame && !currentGameInList;

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="crt-wrapper min-h-screen flex flex-col bg-cyber-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-cyber-panel border-b-2 border-neon-cyan"
        style={{ boxShadow: '0 2px 0px rgba(0,240,255,0.2)' }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-2.5 h-2.5 bg-neon-cyan animate-blink" style={{ boxShadow: '0 0 6px var(--neon-cyan)' }} />
          <p className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest">
            COUP
          </p>
          <AppNav />
        </div>

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center justify-center w-9 h-9 bg-cyber-bg border-2 border-neon-cyan/40 text-neon-cyan/80
              hover:border-neon-cyan hover:text-neon-cyan transition-colors"
            style={{ boxShadow: '2px 2px 0px #000' }}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <User className="w-4 h-4" />
          </button>

          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-2 w-52 bg-cyber-panel border-2 border-neon-cyan/40 z-50"
              style={{ boxShadow: '4px 4px 0px #000' }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-cyber-border">
                <div>
                  <p className="font-pixel text-[9px] text-neon-cyan truncate">
                    {currentUser?.username && currentUser.username.length > 15
                      ? `${currentUser.username.slice(0, 15)}...`
                      : (currentUser?.username ?? "")}
                  </p>
                  <p className="font-mono text-[9px] text-white/40 truncate mt-0.5">
                    {currentUser?.email && currentUser.email.length > 18
                      ? `${currentUser.email.slice(0, 18)}...`
                      : (currentUser?.email ?? "")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-1 text-white/40 hover:text-neon-cyan transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 font-mono text-[10px] text-white/70
                  hover:bg-neon-cyan/10 hover:text-neon-cyan transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                LOG OUT
              </button>
            </motion.div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 md:p-10">
        <div className="w-full max-w-2xl">

          {/* Title row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest mb-1">
                ▸ LOBBY TERMINAL
              </h1>
              <p className="font-mono text-[10px] text-white/30 uppercase">
                Select a game session to join
              </p>
            </div>
            <button
              onClick={handleCreateGame}
              disabled={isCreating || hasWaitingGame}
              className="btn-cyan px-5 py-2.5 text-[9px] tracking-widest"
            >
              {isCreating ? "CREATING..." : "NEW GAME"}
            </button>
          </div>

          <div className="pixel-divider mb-6" />

          {isLoading ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="pixel-spinner" />
              <p className="font-pixel text-neon-cyan text-[9px] animate-blink">SCANNING SESSIONS...</p>
            </div>
          ) : (
            <>
              {/* Current game card */}
              {showCurrentGameCard && (() => {
                const g = inGame as Game;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pixel-panel-yellow p-4 mb-6"
                  >
                    <p className="font-pixel text-[8px] text-neon-yellow glow-yellow mb-1">
                      ▸ YOUR ACTIVE SESSION
                    </p>
                    <p className="font-mono text-white/80 text-sm mb-0.5">
                      Game #{g.id}
                      {g.status === "in_progress"
                        ? <span className="text-neon-green ml-2">[IN PROGRESS]</span>
                        : g.status === "finished"
                          ? <span className="text-neon-red ml-2">[ENDED]</span>
                          : null}
                    </p>
                    <p className="font-mono text-white/40 text-xs mb-3">
                      {playerCount(g)} / {g.max_players} operators
                    </p>
                    <button
                      onClick={() =>
                        navigate(
                          g.status === "in_progress" || g.status === "finished"
                            ? "/game"
                            : `/lobby/${g.id}`,
                          { replace: true }
                        )
                      }
                      className="btn-yellow px-4 py-2 text-[9px] tracking-widest"
                    >
                      {g.status === "in_progress" || g.status === "finished"
                        ? "ENTER GAME"
                        : "ENTER LOBBY"}
                    </button>
                  </motion.div>
                );
              })()}

              {/* Empty state */}
              {games.length === 0 && !showCurrentGameCard ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pixel-panel text-center py-16 px-6"
                >
                  <p className="font-pixel text-[9px] text-white/40 mb-3 tracking-widest">
                    NO ACTIVE SESSIONS
                  </p>
                  <p className="font-mono text-white/30 text-xs">Create a game to get started.</p>
                </motion.div>
              ) : games.length === 0 ? null : (
                <ul className="space-y-2">
                  {games.map((game) => (
                    <motion.li
                      key={game.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pixel-panel flex items-center justify-between p-4
                        hover:border-neon-cyan/50 transition-colors duration-150"
                    >
                      <div>
                        <span className="font-pixel text-[9px] text-white">
                          SESSION #{game.id}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[9px] text-neon-yellow">
                            {playerCount(game)} / {game.max_players}
                          </span>
                          <span className="font-mono text-[9px] text-white/30">operators</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {inGame?.id === game.id ? (
                          <>
                            <button
                              onClick={() => navigate(`/lobby/${game.id}`, { replace: true })}
                              disabled={joiningId === game.id || playerCount(game) >= game.max_players}
                              className="btn-cyan px-4 py-2 text-[8px] tracking-widest disabled:opacity-40"
                            >
                              {joiningId === game.id ? "ENTERING..." : "ENTER"}
                            </button>
                            <button
                              onClick={() => handleLeaveGame(game.id)}
                              className="btn-red px-4 py-2 text-[8px] tracking-widest"
                            >
                              LEAVE
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleJoinGame(game.id)}
                            disabled={joiningId === game.id || playerCount(game) >= game.max_players}
                            className="btn-cyan px-4 py-2 text-[8px] tracking-widest disabled:opacity-40"
                          >
                            {joiningId === game.id ? "JOINING..." : "JOIN"}
                          </button>
                        )}

                        {game.created_by_id != null && String(game.created_by_id) === String(currentUser?.id) ? (
                          <button
                            onClick={() => handleDeleteGame(game.id)}
                            disabled={joiningId === game.id}
                            className="btn-red px-4 py-2 text-[8px] tracking-widest disabled:opacity-40"
                          >
                            DELETE
                          </button>
                        ) : null}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
