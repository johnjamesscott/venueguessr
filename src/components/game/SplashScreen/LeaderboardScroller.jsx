import React, { useState, useEffect, useRef } from 'react';

const MEDAL = ['🥇', '🥈', '🥉'];
const PAGE_SIZE = 4;

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(175,35,28,0.25)',
  borderRadius: 8,
  padding: '6px 10px',
};

const playerStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: '#fff',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const prizeStyle = {
  fontSize: 20,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.5)',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const scoreStyle = {
  fontSize: 26,
  fontWeight: 800,
  color: '#FF4444',
  letterSpacing: 0.5,
};

export default function LeaderboardScroller({ data, isLoading = false, hasError = false }) {
  const [page, setPage] = useState(0);
  const timerRef = useRef(null);

  const { entries = [], competition = null, prizes = [] } = data || {};
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
  const emptySlots = Math.max(0, PAGE_SIZE - visible.length);

  if (isLoading) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
        Loading leaderboard…
      </p>
    );
  }

  if (hasError) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
        Scores temporarily unavailable.
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
                ...rowStyle,
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
                <p style={playerStyle}>
                  {(entry.player_name || '').split(' ')[0]}
                </p>
                <p style={prizeStyle}>
                  {prizeByPosition[globalRank] || '—'}
                </p>
              </div>

              <span style={scoreStyle}>
                {(entry.total_score ?? 0).toLocaleString()}
              </span>
            </div>
          );
        })}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-score-slot-${index}`}
            aria-hidden="true"
            style={{ ...rowStyle, visibility: 'hidden' }}
          >
            <span style={{ fontSize: 36, minWidth: 40 }}>0</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={playerStyle}>Placeholder</p>
              <p style={prizeStyle}>—</p>
            </div>
            <span style={scoreStyle}>0</span>
          </div>
        ))}
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
