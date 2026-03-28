import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, X } from "lucide-react";
import { useAuth } from "../contexts/auth-context.tsx";
import type { Game } from "../api/types.ts";
import { useGameData } from "../hooks/useGameData.ts";

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
      onSuccess: (game) => navigate(`/lobby/${game.id}`, { replace: true }),
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
    <div className="min-h-screen flex flex-col bg-coup-darker">
      <header className="flex items-center justify-between px-6 py-4 border-b border-coup-gold/30">
        <p className="font-gothic text-2xl md:text-3xl font-black tracking-widest text-coup-gold">
          COUP
        </p>
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-coup-gold/40 bg-coup-dark/60 text-light/90 hover:bg-coup-dark hover:border-coup-gold/60 transition-colors focus:outline-none focus:ring-2 focus:ring-coup-gold/50"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <User className="w-5 h-5" />
          </button>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-coup-gold/30 bg-coup-dark shadow-xl py-1 z-50"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-coup-gold/20">
                <div>
                  <p className="text-sm font-medium text-light truncate">{currentUser?.username.length > 15 ? currentUser?.username.slice(0, 15) + "..." : currentUser?.username}</p>
                  <p className="text-xs text-light/60 truncate">{currentUser?.email.length > 15 ? currentUser?.email.slice(0, 15) + "..." : currentUser?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-1 rounded hover:bg-coup-gold/10 text-light/70 hover:text-light"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-light/90 hover:bg-coup-gold/10 hover:text-light transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Log out
              </button>
            </motion.div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-light">
              Lobby List
            </h1>
            <button
              onClick={handleCreateGame}
              disabled={isCreating || hasWaitingGame}
              className="btn-primary px-6 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating…" : "Create Game"}
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-t-transparent border-coup-gold" />
            </div>
          ) : (
            <>
              {showCurrentGameCard && (() => {
                const g = inGame as Game;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-coup-gold/10 border-2 border-coup-gold/50"
                  >
                    <p className="text-light/90 font-medium mb-1">
                      Your current game #{g.id}
                      {g.status === "in_progress" ? " (in progress)" : ""}
                    </p>
                    <p className="text-light/60 text-sm mb-3">
                      {playerCount(g)} / {g.max_players} players
                    </p>
                    <button
                      onClick={() => navigate(g.status === "in_progress" ? "/game" : `/lobby/${g.id}`, { replace: true })}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      {g.status === "in_progress" ? "Enter game" : "Enter lobby"}
                    </button>
                  </motion.div>
                );
              })()}
              {games.length === 0 && !showCurrentGameCard ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-6 rounded-xl bg-coup-dark/50 border border-coup-gold/20"
            >
              <p className="text-light/80 mb-4">No lobbies waiting for players.</p>
              <p className="text-light/60 text-sm">Create a game to get started.</p>
            </motion.div>
          ) : games.length === 0 ? (
            null
          ) : (
            <ul className="space-y-3">
              {games.map((game) => (
                <motion.li
                  key={game.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-coup-dark border border-coup-gold/30 hover:border-coup-gold/50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-light">Game #{game.id}</span>
                    <span className="ml-3 text-light/70 text-sm">
                      {playerCount(game)} / {game.max_players} players
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inGame?.id === game.id ? (
                      <>
                        <button
                          onClick={() => navigate(`/lobby/${game.id}`, { replace: true })}
                          disabled={joiningId === game.id || playerCount(game) >= game.max_players}
                          className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {joiningId === game.id ? "Entering Game…" : "Enter Game"}
                        </button>
                        <button
                          onClick={() => handleLeaveGame(game.id)}
                          className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Leave Game
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleJoinGame(game.id)}
                        disabled={joiningId === game.id || playerCount(game) >= game.max_players}
                        className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {joiningId === game.id ? "Joining…" : "Join"}
                      </button>
                    )}

                    {game.created_by_id != null && String(game.created_by_id) === String(currentUser?.id) ? (
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        disabled={joiningId === game.id || playerCount(game) >= game.max_players}
                        className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
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
