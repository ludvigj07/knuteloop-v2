import React from 'react';

/**
 * StickerCard — the base Knuteloop surface. White card with the signature
 * 2px ink border + hard offset shadow. `interactive` adds the lift/press feel.
 */
export function StickerCard({
  children,
  as: Tag = 'div',
  padding = 'lg',
  radius = 'lg',
  interactive = false,
  tone = 'card',
  style,
  className,
  ...rest
}) {
  const pads = { none: 0, sm: 'var(--space-3)', md: 'var(--space-4)', lg: 'var(--space-6)', xl: 'var(--space-8)' };
  const radii = { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' };
  const tones = {
    card:    { background: 'var(--card)', color: 'var(--text)' },
    soft:    { background: 'var(--surface-soft)', color: 'var(--text)' },
    primary: { background: 'var(--primary)', color: 'var(--text-inverse)' },
    accent:  { background: 'var(--accent)', color: 'var(--accent-foreground)' },
  };

  return (
    <Tag
      className={[interactive ? 'sticker' : null, className].filter(Boolean).join(' ') || undefined}
      style={{
        ...tones[tone],
        padding: pads[padding],
        borderRadius: radii[radius],
        border: interactive ? undefined : 'var(--border-sticker)',
        boxShadow: interactive ? undefined : 'var(--shadow-sticker)',
        cursor: interactive ? 'pointer' : undefined,
        textAlign: 'left',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
