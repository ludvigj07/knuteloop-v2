import React from 'react';

/**
 * Chip — small pill label for category, difficulty, points, or status.
 * `tone` maps to the semantic palette. Optional leading icon.
 */
export function Chip({ children, tone = 'neutral', size = 'base', icon, outline = false, style, ...rest }) {
  const tones = {
    neutral: { bg: 'var(--surface-soft)', fg: 'var(--text-soft)', bd: 'var(--line)' },
    primary: { bg: 'var(--primary-bg)', fg: 'var(--primary-strong)', bd: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
    accent:  { bg: 'var(--accent-bg)', fg: 'var(--accent-strong)', bd: 'var(--accent-border)' },
    success: { bg: 'var(--success-bg)', fg: 'var(--success)', bd: 'color-mix(in srgb, var(--success) 32%, transparent)' },
    warning: { bg: 'var(--warning-bg)', fg: 'color-mix(in srgb, var(--warning) 60%, var(--foreground))', bd: 'color-mix(in srgb, var(--warning) 36%, transparent)' },
    danger:  { bg: 'var(--danger-bg)', fg: 'var(--danger-strong)', bd: 'color-mix(in srgb, var(--danger) 32%, transparent)' },
  };
  const t = tones[tone] || tones.neutral;
  const sizes = {
    sm:   { padding: '3px 9px', fontSize: '0.72rem', gap: 4 },
    base: { padding: '5px 12px', fontSize: 'var(--text-xs)', gap: 5 },
    lg:   { padding: '7px 15px', fontSize: 'var(--text-sm)', gap: 6 },
  };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', ...sizes[size],
        borderRadius: 'var(--radius-full)',
        background: outline ? 'transparent' : t.bg,
        color: t.fg,
        border: `1.5px solid ${t.bd}`,
        fontWeight: 700,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
