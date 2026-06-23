import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MEDAL = ['🥇', '🥈', '🥉'];
const PAGE_SIZE = 4;

async function fetchLeaderboard() {
  // Fetch active competition first
  const res = await base44.functions.invoke('getActiveCompetition', {});
  const competition = res?.data?.competition || null;

  if (!competition) return { entries: [], competition: null, prizes: [] };

  // Fetch entries and prizes for this competition in parallel
  const [entries, prizes] = await Promise.all([
    base44.entities.LeaderboardEntry.filter(
      { competition_id: competition.id },
      '-total_score',
      20
    ),
    base44.entities.Prize.filter({ competition_id: competition.id, active: true }),
  ]);

  return { entries, competition, prizes };
}

export default function LeaderboardScroller() {
  const [page, setPage] = useState(0);
  const timerRef = useRef(null);

  const { data = { entries: [], competition: null, prizes: [] }, isLoading } = useQuery({
    queryKey: ['leaderboard-splash'],
    queryFn: fetchLeaderboard,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 2,
  });

  const { entries, competition, prizes } = data;
  const prizeByPosition = (prizes || []).reduce((acc, p) => {
    acc[p.position] = p.prize_name;
    return acc;
  }, {});
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [competition?.id]);

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

  if (!competition) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
        No active competition.
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
        No scores yet — be the first!
      </p>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {competition.name && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 6px', textAlign: 'center' }}>
          {competition.name}
        </p>
      )}

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
              <span style={{
                fontSize: globalRank <= 3 ? 36 : 26,
                fontWeight: 900,
                color: '#FFD700',
                minWidth: 40,
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {globalRank <= 3 ? MEDAL[globalRank - 1] : globalRank}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(entry.player_name || '').split(' ')[0]}
                </p>
                <p style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prizeByPosition[globalRank] || '—'}
                </p>
              </div>

              <span style={{ fontSize: 26, fontWeight: 800, color: '#FF4444', letterSpacing: 0.5 }}>
                {(entry.total_score ?? 0).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

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