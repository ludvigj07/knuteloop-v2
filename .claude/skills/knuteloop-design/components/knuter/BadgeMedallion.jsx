import React from 'react';

const TIER = {
  bronze:  { grad: 'var(--tier-bronze)', label: 'Bronse', glow: 'none' },
  sølv:    { grad: 'var(--tier-silver)', label: 'Sølv', glow: 'none' },
  gull:    { grad: 'var(--tier-gold)', label: 'Gull', glow: '0 0 16px rgba(255,200,60,0.45)' },
  diamant: { grad: 'var(--tier-diamond)', label: 'Diamant', glow: '0 0 22px rgba(120,200,240,0.6)' },
};

/**
 * BadgeMedallion — an achievement badge with a tiered metallic ring.
 * `tier`: bronze / sølv / gull / diamant. Shows the icon, name, and tier.
 * `locked` desaturates it.
 */
export function BadgeMedallion({ icon, name, tier = 'bronze', caption, locked = false, size = 72, style, ...rest }) {
  const t = TIER[tier] || TIER.bronze;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', width: 'fit-content', ...style }} {...rest}>
      <span style={{
        display: 'grid', placeItems: 'center', width: size, height: size,
        borderRadius: 'var(--radius-full)',
        background: locked ? 'var(--surface-soft)' : t.grad,
        border: '2px solid var(--foreground)',
        boxShadow: locked ? 'none' : t.glow,
        filter: locked ? 'grayscale(1) opacity(0.55)' : 'none',
        position: 'relative',
      }}>
        <span style={{
          display: 'grid', placeItems: 'center', width: '74%', height: '74%',
          borderRadius: 'var(--radius-full)', background: 'var(--card)',
          boxShadow: 'inset 0 1px 4px rgba(15,26,46,0.12)',
          color: 'var(--foreground)', fontSize: size * 0.34,
        }}>
          {icon}
        </span>
      </span>
      {name && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-strong)', lineHeight: 1.05 }}>{name}</span>}
      <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: locked ? 'var(--text-muted)' : 'var(--accent-strong)' }}>
        {locked ? 'Låst' : t.label}{caption ? ` · ${caption}` : ''}
      </span>
    </div>
  );
}
