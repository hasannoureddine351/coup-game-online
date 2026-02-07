import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useGameData } from "../hooks/useGameData.ts";

export default function LobbyRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useCurrentGameQuery, leaveGame, deleteGame } = useGameData();

  const gameId = id != null ? parseInt(id, 10) : NaN;
  const { data: currentGame, isLoading, isFetched } = useCurrentGameQuery({
    refetchInterval: !Number.isNaN(gameId) ? 2000 : undefined,
  });

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
  }, [gameId, isLoading, isFetched, currentGame, navigate]);

  const handleLeave = () =>
    leaveGame.mutate(gameId, {
      onSuccess: () => navigate("/lobby", { replace: true }),
    });

  const handleDelete = () =>
    deleteGame.mutate(gameId, {
      onSuccess: () => navigate("/lobby", { replace: true }),
    });

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
                        <span className="text-sm text-light/60">
                          Seat {player.seat_number}
                        </span>
                      </li>
                    ))}
                </ul>
              </motion.div>

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
