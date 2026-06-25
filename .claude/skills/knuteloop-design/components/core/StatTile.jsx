import React from 'react';

/**
 * StatTile — a compact stat readout (points, streak, rank, completed knuter).
 * Big display number, label below, optional icon. Numbers use the mono face.
 */
export function StatTile({ value, label, icon, tone = 'card', align = 'left', style, ...rest }) {
  const tones = {
    card:    { background: 'var(--card)', color: 'var(--text)', sub: 'var(--text-muted)' },
    primary: { background: 'var(--primary)', color: 'var(--text-inverse)', sub: 'color-mix(in srgb, var(--text-inverse) 72%, transparent)' },
    accent:  { background: 'var(--accent)', color: 'var(--accent-foreground)', sub: 'color-mix(in srgb, var(--accent-foreground) 70%, transparent)' },
    soft:    { background: 'var(--surface-soft)', color: 'var(--text)', sub: 'var(--text-muted)' },
  };
  const t = tones[tone];
  return (
    <div
      className="sticker"
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        background: t.background, color: t.color,
        minWidth: 96,
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', marginBottom: 2, opacity: 0.95 }}>{icon}</span>}
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-2xl)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: t.sub }}>
        {label}
      </span>
    </div>
  );
}
