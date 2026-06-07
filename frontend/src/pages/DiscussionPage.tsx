import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { discussionService } from '../api/services/discussionService';
import type { DiscussionPost } from '../api/types';
import AppNav from '../components/layout/AppNav';

export default function DiscussionPage() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([] as DiscussionPost[]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newBody, setNewBody] = useState('');
  const [expandedId, setExpandedId] = useState(null as number | null);
  const [thread, setThread] = useState(null as DiscussionPost | null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = () => {
    setLoading(true);
    discussionService
      .listPosts(page)
      .then((res) => {
        setPosts(res.data);
        setLastPage(res.last_page);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [page]);

  const openThread = (id: number) => {
    setExpandedId(id);
    discussionService.getPost(id).then(setThread);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      await discussionService.createPost(newBody.trim());
      setNewBody('');
      setPage(1);
      loadPosts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expandedId || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      await discussionService.reply(expandedId, replyBody.trim());
      setReplyBody('');
      openThread(expandedId);
      loadPosts();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="crt-wrapper min-h-screen bg-cyber-bg text-white">
      <header className="flex items-center justify-between px-6 py-4 bg-cyber-panel border-b-2 border-neon-cyan">
        <motion.div className="flex items-center gap-4">
          <Link to="/lobby" className="font-pixel text-neon-cyan text-sm glow-cyan tracking-widest">
            COUP
          </Link>
          <AppNav />
        </motion.div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-pixel text-neon-purple text-sm glow-purple tracking-widest mb-6">
          ▸ COMMUNITY HUB
        </h1>

        <form onSubmit={handleCreate} className="pixel-panel-cyan p-4 mb-8 space-y-3">
          <label className="font-pixel text-[8px] text-neon-cyan/80">NEW POST</label>
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Share strategy, LFG, or table talk..."
            className="w-full bg-black/50 border border-neon-cyan/30 p-3 font-mono text-sm text-white resize-none focus:outline-none focus:border-neon-cyan"
          />
          <button type="submit" disabled={submitting} className="btn-cyan text-[10px]">
            {submitting ? 'POSTING...' : 'POST'}
          </button>
        </form>

        {loading && <p className="font-mono text-white/50 text-center py-8">Loading...</p>}

        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="pixel-panel p-4 border border-white/10">
              <motion.div className="flex justify-between gap-2 mb-2">
                <span className="font-pixel text-[9px] text-neon-yellow">{post.user?.username}</span>
                <span className="font-mono text-[9px] text-white/40">
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </motion.div>
              <p className="font-mono text-sm text-white/90 whitespace-pre-wrap">{post.body}</p>
              <motion.div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => openThread(post.id)}
                  className="font-mono text-[10px] text-neon-cyan hover:underline"
                >
                  {post.replies_count ?? 0} replies
                </button>
                {currentUser?.id === String(post.user_id) && (
                  <button
                    type="button"
                    onClick={() => discussionService.deletePost(post.id).then(loadPosts)}
                    className="font-mono text-[10px] text-neon-red/80 hover:underline"
                  >
                    delete
                  </button>
                )}
              </motion.div>

              {expandedId === post.id && thread && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                  {(thread.replies ?? []).map((r) => (
                    <motion.div key={r.id} className="pl-3 border-l-2 border-neon-purple/40">
                      <p className="font-pixel text-[8px] text-neon-purple mb-1">{r.user?.username}</p>
                      <p className="font-mono text-xs text-white/80">{r.body}</p>
                    </motion.div>
                  ))}
                  <form onSubmit={handleReply} className="space-y-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={2}
                      placeholder="Reply..."
                      className="w-full bg-black/40 border border-neon-purple/30 p-2 font-mono text-xs"
                    />
                    <button type="submit" disabled={submitting} className="btn-purple text-[9px]">
                      REPLY
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>

        {lastPage > 1 && (
          <div className="flex justify-center gap-4 mt-8">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-cyan text-[10px] disabled:opacity-40"
            >
              PREV
            </button>
            <span className="font-mono text-xs text-white/50">
              {page} / {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="btn-cyan text-[10px] disabled:opacity-40"
            >
              NEXT
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
