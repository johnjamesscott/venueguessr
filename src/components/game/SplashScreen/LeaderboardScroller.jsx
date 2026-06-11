import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MEDAL = ['🥇', '🥈', '🥉'];
const PAGE_SIZE = 4;

async function fetchLeaderboard() {
  const entries = await base44.entities.LeaderboardEntry.list('-total_score', 12);
  return entries;
}

export default function LeaderboardScroller() {
  const [page, setPage] = useState(0);
  const timerRef = useRef(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard-splash'],
    queryFn: fetchLeaderboard,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 2,
  });

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  useEffect(() => {
    if (entries.length <= PAGE_SIZE) return;
    timerRef.current = setInterval(() => {
      setPage(p => (p + 1) % totalPages);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [entries.length, totalPages]);

  const visible = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (isLoading) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
        Loading leaderboard…
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
        No scores yet. Be the first!
      </p>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map((entry, i) => {
          const globalRank = page * PAGE_SIZE + i + 1;
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(175,35,28,0.25)',
                borderRadius: 8,
                padding: '6px 10px',
                animation: `slideUpIn 0.4s ease-out ${i * 0.07}s both`,
              }}
            >
              {/* Rank */}
              <span style={{
                fontSize: globalRank <= 3 ? 18 : 13,
                fontWeight: 900,
                color: '#FFD700',
                minWidth: 24,
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {globalRank <= 3 ? MEDAL[globalRank - 1] : globalRank}
              </span>

              {/* Name + achievement */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(entry.player_name || '').split(' ')[0]}
                </p>
                <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {entry.rounds_played ?? 0} rounds played
                </p>
              </div>

              {/* Score */}
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FF4444', letterSpacing: 0.5 }}>
                {(entry.total_score ?? 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: i === page ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === page ? '#AF231C' : 'rgba(255,255,255,0.25)',
                boxShadow: i === page ? '0 0 6px #AF231C' : 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}