import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useAuth } from "../contexts/auth-context.tsx";
import { useGameData } from "../hooks/useGameData.ts";
import { useGameWebSocket } from "../hooks/useGameWebSocket.ts";

export default function LobbyRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { useCurrentGameQuery, leaveGame, deleteGame, toggleReady, startGame } = useGameData();

  const gameId = id != null ? parseInt(id, 10) : NaN;
  const { data: currentGame, isLoading, isFetched } = useCurrentGameQuery({
    refetchInterval: !Number.isNaN(gameId) ? 2000 : undefined,
  });

  useGameWebSocket(
    !Number.isNaN(gameId) ? gameId : null,
    token,
    {
      onGameStarted: () => navigate("/game", { replace: true }),
    }
  );

  useEffect(() => {
    if (Number.isNaN(gameId)) {
      console.log("gameId is NaN");
      navigate("/lobby", { replace: true });
      return;
    }
    if (isFetched && !isLoading && (!currentGame?.id || currentGame.id !== gameId)) {
      console.log("currentGame is null or currentGame.id !== gameId");
      console.log("currentGame", currentGame);
      console.log("gameId", gameId);
      navigate("/lobby", { replace: true });
    }
    if (currentGame?.status === 'in_progress') {
      navigate("/game", { replace: true });
    }
  }, [gameId, isLoading, isFetched, currentGame, navigate]);

  const handleLeave = () =>
    leaveGame.mutate(gameId, {
      onSuccess: () => navigate("/lobby", { replace: true }),
    });

  const handleDelete = () =>
    deleteGame.mutate(gameId, {
      onSuccess: () => navigate("/lobby", { replace: true }),
    });

  const handleToggleReady = () => {
    toggleReady.mutate(gameId);
  };

  const handleStartGame = () => {
    startGame.mutate(gameId, {
      onSuccess: () => navigate("/game", { replace: true }),
    });
  };

  if (Number.isNaN(gameId)) {
    return null;
  }

  const playerCount = currentGame?.players?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-coup-darker">
      <header className="flex items-center justify-between px-6 py-4 border-b border-coup-gold/30">
        <p className="font-gothic text-2xl md:text-3xl font-black tracking-widest text-coup-gold">
          COUP
        </p>
        <button
          onClick={() => navigate("/lobby")}
          className="text-coup-gold/90 hover:text-coup-gold transition-colors"
        >
          ← Back to lobbies
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-t-transparent border-coup-gold" />
            </div>
          ) : currentGame ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-light">
                  Lobby #{currentGame?.id}
                </h1>
                <p className="text-light/70">
                  {playerCount} / {currentGame?.max_players} players
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-coup-dark border border-coup-gold/30 overflow-hidden mb-6"
              >
                <h2 className="px-4 py-3 text-sm font-medium text-light/80 border-b border-coup-gold/20">
                  Players
                </h2>
                <ul className="divide-y divide-coup-gold/20">
                  {currentGame.players
                    ?.sort((a, b) => a.seat_number - b.seat_number)
                    .map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-light">
                            {player.user?.username ?? `Player ${player.seat_number}`}
                          </span>
                          {currentGame.created_by_id != null &&
                          String(player.user_id) === String(currentGame.created_by_id) ? (
                            <Crown className="w-4 h-4 text-coup-gold" aria-hidden />
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          {player.is_ready && (
                            <span className="text-emerald-400 text-sm font-medium">Ready</span>
                          )}
                          <span className="text-sm text-light/60">
                            Seat {player.seat_number}
                          </span>
                        </div>
                      </li>
                    ))}
                </ul>
              </motion.div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleToggleReady}
                    disabled={toggleReady.isPending || currentGame.status !== 'waiting'}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      currentGame.players?.find(p => p.user_id === currentGame.created_by_id)?.is_ready
                        ? 'bg-neutral-700 hover:bg-neutral-600'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {toggleReady.isPending
                      ? "Updating..."
                      : currentGame.players?.find(p => p.user_id === currentGame.created_by_id)?.is_ready
                      ? "Not Ready"
                      : "Ready"}
                  </button>

                  {currentGame.host && playerCount >= 2 && currentGame.players?.every(p => p.is_ready) && (
                    <button
                      onClick={handleStartGame}
                      disabled={startGame.isPending}
                      className="bg-coup-gold hover:bg-coup-gold/90 text-coup-darker px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {startGame.isPending ? "Starting..." : "Start Game"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLeave}
                    disabled={leaveGame.isPending}
                    className="btn-secondary px-6 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {leaveGame.isPending ? "Leaving…" : "Leave"}
                  </button>
                  {currentGame.host && (
                    <button
                      onClick={handleDelete}
                      disabled={deleteGame.isPending}
                      className="btn-secondary px-6 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deleteGame.isPending ? "Deleting…" : "Delete lobby"}
                    </button>
                  )}
                </div>

                {playerCount < 2 && (
                  <p className="text-sm text-yellow-400">Need at least 2 players to start</p>
                )}
                {playerCount >= 2 && !currentGame.players?.every(p => p.is_ready) && (
                  <p className="text-sm text-yellow-400">All players must be ready to start</p>
                )}
              </div>

              {currentGame?.status !== "waiting" && (
                <p className="mt-4 text-sm text-light/60">
                  This game is no longer waiting for players.
                </p>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
