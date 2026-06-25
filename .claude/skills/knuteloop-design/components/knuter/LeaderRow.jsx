import React from 'react';
import { Avatar } from '../core/Avatar.jsx';

/** Leaderboard rank → title (v1 spec §6). */
export function getLeaderboardTitle(rank) {
  if (rank === 1) return "O' Store Knutemester";
  if (rank <= 3) return 'Knutemester';
  if (rank <= 10) return 'Knutebaron';
  if (rank <= 20) return 'Knuteridder';
  if (rank <= 35) return 'Knutesersjant';
  if (rank <= 55) return 'Knuteknekt';
  if (rank <= 80) return 'Knutelærling';
  if (rank <= 110) return 'Knuteamatør';
  if (rank <= 145) return 'Knuteprøvling';
  if (rank <= 185) return 'Knutetabbe';
  if (rank <= 220) return 'Knutenybegynner';
  return 'Knutekatastrofen';
}

const MEDAL = { 1: '#d6a429', 2: '#9ea4ad', 3: '#b07a47' };

/**
 * LeaderRow — one row of the toppliste: rank, avatar, russenavn + rank title,
 * points. `highlight` marks the signed-in user. `showTitle` shows the rank title.
 */
export function LeaderRow({ rank, name, group, points, russType = 'blue', photoUrl, highlight = false, showTitle = true, style, ...rest }) {
  const medal = MEDAL[rank];
  return (
    <div
      className="sticker"
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)',
        background: highlight ? 'var(--accent-bg)' : 'var(--card)',
        ...style,
      }}
      {...rest}
    >
      <span style={{
        display: 'grid', placeItems: 'center', width: 38, height: 38, flexShrink: 0,
        borderRadius: 'var(--radius-full)',
        background: medal || 'var(--surface-soft)',
        color: medal ? '#fff' : 'var(--text-soft)',
        border: '2px solid var(--foreground)',
        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-base)',
      }}>
        {rank}
      </span>
      <Avatar name={name} src={photoUrl} size={44} ring={russType} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
          {showTitle ? getLeaderboardTitle(rank) : group}{showTitle && group ? ` · ${group}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-strong)', lineHeight: 1 }}>
          {new Intl.NumberFormat('nb-NO').format(points)}
        </div>
        <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>poeng</div>
      </div>
    </div>
  );
}
