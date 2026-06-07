import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { leaderboardService } from '../api/services/leaderboardService';
import type { LeaderboardEntry } from '../api/types';
import LeaderboardPlayerDetail from '../components/leaderboard/LeaderboardPlayerDetail';
import LeaderboardPodium from '../components/leaderboard/LeaderboardPodium';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import AppNav from '../components/layout/AppNav';

export default function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState([] as LeaderboardEntry[]);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null as LeaderboardEntry | null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    leaderboardService
      .getLeaderboard(page)
      .then((res) => {
        if (cancelled) return;
        setEntries(res.data);
        setLastPage(res.meta.last_page);
        setSelectedEntry((prev) => {
          if (!prev) return null;
          return res.data.find((e) => e.user_id === prev.user_id) ?? null;
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const topThree = page === 1 ? entries.slice(0, 3) : [];

  return (
    <div className="crt-wrapper min-h-screen bg-cyber-bg text-white">
      <header className="flex items-center justify-between px-6 py-4 bg-cyber-panel border-b-2 border-neon-cyan">
        <div className="flex items-center gap-4">
          <Link to="/lobby" className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest">
            COUP
          </Link>
          <AppNav />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <h1 className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest mb-2">
          ▸ LEADERBOARD
        </h1>
        <p className="font-mono text-white/50 text-sm mb-8">
          Rankings by wins, win rate, and bluff success.
        </p>

        {page === 1 && topThree.length > 0 && <LeaderboardPodium topThree={topThree} />}

        <LeaderboardTable
          entries={entries}
          page={page}
          lastPage={lastPage}
          onPageChange={(p) => {
            setPage(p);
            setSelectedEntry(null);
          }}
          loading={loading}
          selectedUserId={selectedEntry?.user_id ?? null}
          onRowClick={(entry) =>
            setSelectedEntry((prev) => (prev?.user_id === entry.user_id ? null : entry))
          }
        />

        {selectedEntry && (
          <LeaderboardPlayerDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        )}
      </main>
    </div>
  );
}
