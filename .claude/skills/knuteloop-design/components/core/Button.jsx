import React from 'react';

/**
 * Button — Knuteloop's primary action. Pill-shaped, sticker treatment
 * (2px ink border + hard offset shadow) on the bordered variants.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'base',
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  style,
  ...rest
}) {
  const sizes = {
    sm:   { padding: '8px 16px', fontSize: 'var(--text-sm)', minHeight: 40, gap: 6 },
    base: { padding: '12px 22px', fontSize: 'var(--text-base)', minHeight: 'var(--tap-size)', gap: 8 },
    lg:   { padding: '16px 30px', fontSize: 'var(--text-lg)', minHeight: 58, gap: 10 },
  };

  const variants = {
    primary:     { background: 'var(--primary)', color: 'var(--text-inverse)', border: 'var(--border-sticker)', boxShadow: 'var(--shadow-sticker)' },
    accent:      { background: 'var(--accent)', color: 'var(--accent-foreground)', border: 'var(--border-sticker)', boxShadow: 'var(--shadow-sticker)', textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: 'var(--font-display)' },
    secondary:   { background: 'var(--card)', color: 'var(--foreground)', border: 'var(--border-sticker)', boxShadow: 'var(--shadow-sticker)' },
    ghost:       { background: 'transparent', color: 'var(--text-soft)', border: '2px solid transparent', boxShadow: 'none' },
    destructive: { background: 'var(--danger)', color: '#fff', border: '2px solid var(--danger-strong)', boxShadow: 'var(--shadow-sticker)' },
  };

  const isSticker = ['primary', 'accent', 'secondary', 'destructive'].includes(variant);

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={isSticker ? 'sticker' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        ...sizes[size],
        ...variants[variant],
        width: fullWidth ? '100%' : undefined,
        borderRadius: 'var(--radius-full)',
        fontWeight: variant === 'accent' ? 800 : 700,
        fontFamily: variants[variant].fontFamily || 'var(--font-sans)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 16, height: 16, borderRadius: '50%',
      border: '2px solid currentColor', borderTopColor: 'transparent',
      display: 'inline-block', animation: 'knl-spin 0.7s linear infinite',
    }}>
      <style>{'@keyframes knl-spin{to{transform:rotate(360deg)}}'}</style>
    </span>
  );
}
