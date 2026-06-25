import React from 'react';

const GRADIENTS = [
  ['#ff7b6b', '#ff4f7a'], ['#7f5cff', '#5e8bff'], ['#1f9d8b', '#0f6a7a'],
  ['#ff9966', '#ff5e62'], ['#f15bb5', '#9b5de5'], ['#2f80ed', '#56ccf2'],
];

function hashIndex(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % GRADIENTS.length;
}

/**
 * Avatar — a russ's avatar. Photo if `src`, else initials on a deterministic
 * gradient. Optional `ring` colored by russType (rødruss / blåruss).
 */
export function Avatar({ name = '', src, size = 48, ring = 'none', square = false, style, ...rest }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  const [c1, c2] = GRADIENTS[hashIndex(name)];
  const ringColor = ring === 'red' ? 'var(--russ-red)' : ring === 'blue' ? 'var(--primary)' : ring === 'accent' ? 'var(--accent)' : null;
  const radius = square ? 'var(--radius-md)' : 'var(--radius-full)';

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, flexShrink: 0,
        borderRadius: radius,
        background: src ? 'var(--surface-media)' : `linear-gradient(140deg, ${c1}, ${c2})`,
        color: '#fff',
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: size * 0.4, letterSpacing: '-0.02em',
        overflow: 'hidden',
        border: ringColor ? `2.5px solid ${ringColor}` : 'var(--border-sticker)',
        boxShadow: ringColor ? `0 0 0 2px var(--card), 0 0 0 4px ${ringColor}` : 'none',
        ...style,
      }}
      {...rest}
    >
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials}
    </span>
  );
}
