import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import AppNav from "../components/layout/AppNav";
import { useAuth } from "../contexts/auth-context";
import { useGameData } from "../hooks/useGameData";
import { useGameWebSocket } from "../hooks/useGameWebSocket";

export default function LobbyRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { useCurrentGameQuery, leaveGame, deleteGame, toggleReady, startGame } = useGameData();

  const gameId = id != null ? parseInt(id, 10) : NaN;
  const { data: currentGame, isLoading, isFetched } = useCurrentGameQuery();

  useGameWebSocket(
    !Number.isNaN(gameId) ? gameId : null,
    token,
    { onGameStarted: () => navigate("/game", { replace: true }) }
  );

  useEffect(() => {
    if (Number.isNaN(gameId)) { navigate("/lobby", { replace: true }); return; }
    if (isFetched && !isLoading && (!currentGame?.id || currentGame.id !== gameId)) {
      navigate("/lobby", { replace: true }); return;
    }
    if (currentGame?.id === gameId && currentGame.status === "in_progress") {
      navigate("/game", { replace: true });
    }
  }, [gameId, isLoading, isFetched, currentGame, navigate]);

  const handleLeave = () =>
    leaveGame.mutate(gameId, { onSuccess: () => navigate("/lobby", { replace: true }) });

  const handleDelete = () =>
    deleteGame.mutate(gameId, { onSuccess: () => navigate("/lobby", { replace: true }) });

  const handleToggleReady = () => toggleReady.mutate(gameId);

  const handleStartGame = () =>
    startGame.mutate(gameId, { onSuccess: () => navigate("/game", { replace: true }) });

  if (Number.isNaN(gameId)) return null;

  const playerCount = currentGame?.players?.length ?? 0;
  const myPlayer = currentGame?.players?.find(
    (p) => String(p.user_id) === String(user?.id)
  );
  const iAmReady = myPlayer?.is_ready ?? false;
  const allReady = currentGame?.players?.every(p => p.is_ready) ?? false;
  const canStart = currentGame?.host && playerCount >= 2 && allReady;

  return (
    <div className="crt-wrapper min-h-screen flex flex-col bg-cyber-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-cyber-panel border-b-2 border-neon-cyan"
        style={{ boxShadow: '0 2px 0px rgba(0,240,255,0.2)' }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-2.5 h-2.5 shrink-0 bg-neon-cyan animate-blink" style={{ boxShadow: '0 0 6px var(--neon-cyan)' }} />
          <p className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest">COUP</p>
          <AppNav />
        </div>
        <button
          onClick={() => navigate("/lobby")}
          className="hidden sm:inline font-pixel text-[8px] text-neon-cyan/70 hover:text-neon-cyan transition-colors tracking-widest shrink-0"
        >
          ← BACK TO LOBBY
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          {isLoading ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="pixel-spinner" />
              <p className="font-pixel text-neon-cyan text-[9px] animate-blink">LOADING SESSION...</p>
            </div>
          ) : currentGame ? (
            <>
              {/* Room header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest mb-1">
                    ▸ SESSION #{currentGame?.id}
                  </h1>
                  <p className="font-mono text-[10px] text-white/40 uppercase">
                    Waiting for operators to ready up
                  </p>
                </div>
                <div className="pixel-panel-yellow px-3 py-2 text-right">
                  <p className="font-mono text-[9px] text-neon-yellow/60">OPERATORS</p>
                  <p className="font-pixel text-neon-yellow text-[10px] glow-yellow">
                    {playerCount} / {currentGame?.max_players}
                  </p>
                </div>
              </div>

              <div className="pixel-divider mb-5" />

              {/* Player list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pixel-panel overflow-hidden mb-6"
              >
                <div className="px-4 py-2.5 border-b border-cyber-border bg-cyber-bg">
                  <p className="font-pixel text-[8px] text-white/50 tracking-widest uppercase">
                    Connected Operators
                  </p>
                </div>
                <ul className="divide-y divide-cyber-border">
                  {currentGame.players
                    ?.sort((a, b) => a.seat_number - b.seat_number)
                    .map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 ${player.is_ready ? 'bg-neon-green' : 'bg-white/20'}`}
                            style={player.is_ready ? { boxShadow: '0 0 4px var(--neon-green)' } : {}} />
                          <span className="font-pixel text-[9px] text-white">
                            {player.user?.username ?? `Player ${player.seat_number}`}
                          </span>
                          {currentGame.created_by_id != null &&
                            String(player.user_id) === String(currentGame.created_by_id) ? (
                            <Crown className="w-3.5 h-3.5 text-neon-yellow" aria-hidden />
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3">
                          {player.is_ready ? (
                            <span className="font-pixel text-[7px] text-neon-green glow-green border border-neon-green/40 px-1.5 py-0.5"
                              style={{ boxShadow: '1px 1px 0px #000' }}>
                              READY
                            </span>
                          ) : (
                            <span className="font-pixel text-[7px] text-white/30 border border-white/10 px-1.5 py-0.5">
                              WAITING
                            </span>
                          )}
                          <span className="font-mono text-[9px] text-white/30">
                            Seat {player.seat_number}
                          </span>
                        </div>
                      </li>
                    ))}
                </ul>
              </motion.div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleToggleReady}
                    disabled={toggleReady.isPending || currentGame.status !== 'waiting'}
                    className={iAmReady ? 'btn-red px-6 py-2.5 text-[9px] tracking-widest' : 'btn-green px-6 py-2.5 text-[9px] tracking-widest'}
                  >
                    {toggleReady.isPending
                      ? "UPDATING..."
                      : iAmReady
                      ? "NOT READY"
                      : "READY UP"}
                  </button>

                  {canStart && (
                    <button
                      onClick={handleStartGame}
                      disabled={startGame.isPending}
                      className="btn-cyan px-6 py-2.5 text-[9px] tracking-widest animate-glow-pulse"
                    >
                      {startGame.isPending ? "STARTING..." : "▶ START GAME"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleLeave}
                    disabled={leaveGame.isPending}
                    className="btn-yellow px-6 py-2 text-[9px] tracking-widest"
                  >
                    {leaveGame.isPending ? "LEAVING..." : "LEAVE SESSION"}
                  </button>
                  {currentGame.host && (
                    <button
                      onClick={handleDelete}
                      disabled={deleteGame.isPending}
                      className="btn-red px-6 py-2 text-[9px] tracking-widest"
                    >
                      {deleteGame.isPending ? "DELETING..." : "DELETE LOBBY"}
                    </button>
                  )}
                </div>

                {/* Status hints */}
                {playerCount < 2 && (
                  <p className="font-mono text-[10px] text-neon-yellow">
                    ⚠ Need at least 2 operators to start
                  </p>
                )}
                {playerCount >= 2 && !allReady && (
                  <p className="font-mono text-[10px] text-neon-yellow">
                    ⚠ All operators must be ready to start
                  </p>
                )}
              </div>

              {currentGame?.status !== "waiting" && (
                <p className="mt-4 font-mono text-[10px] text-white/40">
                  This session is no longer accepting players.
                </p>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
