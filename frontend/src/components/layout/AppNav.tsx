import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const links = [
  { to: '/lobby', label: 'Lobby' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/discussion', label: 'Discussion' },
];

function navLinkClass(active: boolean, block = false) {
  const base = block
    ? 'block w-full text-left font-pixel text-[10px] px-4 py-3 border-2 tracking-wider transition-colors'
    : 'font-pixel text-[9px] px-3 py-1.5 border-2 transition-colors tracking-wider';
  return active
    ? `${base} border-neon-cyan text-neon-cyan bg-neon-cyan/10`
    : `${base} border-white/25 text-white/70 hover:border-neon-cyan/50 hover:text-neon-cyan`;
}

export default function AppNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative flex items-center">
      <nav className="hidden sm:flex items-center gap-2" aria-label="Main navigation">
        {links.map(({ to, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={navLinkClass(active)}
              style={{ boxShadow: active ? '2px 2px 0px #000' : undefined }}
            >
              {label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="sm:hidden flex items-center justify-center w-9 h-9 border-2 border-neon-cyan/40 text-neon-cyan
          hover:border-neon-cyan hover:bg-neon-cyan/10 transition-colors"
        style={{ boxShadow: '2px 2px 0px #000' }}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/70 sm:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            className="fixed left-0 right-0 top-[57px] z-50 sm:hidden border-b-2 border-neon-cyan bg-cyber-panel p-3 space-y-2"
            style={{ boxShadow: '0 4px 0px rgba(0,240,255,0.15)' }}
            aria-label="Mobile navigation"
          >
            {links.map(({ to, label }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={navLinkClass(active, true)}
                  style={{ boxShadow: '2px 2px 0px #000' }}
                  onClick={() => setOpen(false)}
                >
                  {label.toUpperCase()}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}

