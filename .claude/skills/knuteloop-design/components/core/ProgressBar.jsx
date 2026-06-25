import React from 'react';

/**
 * ProgressBar — track + fill for badge tiers, knute-folder completion, etc.
 * Rounded, ink-bordered track. `tone` colors the fill.
 */
export function ProgressBar({ value = 0, max = 100, tone = 'primary', height = 12, showLabel = false, label, style, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fills = {
    primary: 'var(--primary)',
    accent: 'var(--accent)',
    success: 'var(--success)',
  };
  return (
    <div style={{ ...style }} {...rest}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
          <span>{label}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{value}/{max}</span>
        </div>
      )}
      <div style={{
        height, borderRadius: 'var(--radius-full)',
        background: 'var(--surface-soft)',
        border: '1.5px solid var(--line-strong)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: fills[tone] || fills.primary,
          borderRadius: 'var(--radius-full)',
          transition: 'width var(--dur-slow) var(--ease-out)',
        }} />
      </div>
    </div>
  );
}
