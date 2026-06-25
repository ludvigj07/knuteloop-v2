import React from 'react';
import { KnoteIcon } from './KnoteIcon.jsx';

/**
 * KnoteLogo — the Knuteloop lockup: the loop knot mark + "Knuteloop" wordmark
 * in the display face. `variant` controls layout; `tone` the color treatment.
 */
export function KnoteLogo({ variant = 'full', tone = 'ink', size = 28, ...rest }) {
  const color = tone === 'inverse' ? 'var(--text-inverse)' : tone === 'primary' ? 'var(--primary)' : 'var(--foreground)';
  const markColor = tone === 'inverse' ? 'var(--accent)' : 'var(--primary)';

  const mark = (
    <span style={{ color: markColor, display: 'inline-flex' }} aria-hidden="true">
      <KnoteIcon name="knute" size={size * 1.7} />
    </span>
  );

  if (variant === 'mark') {
    return <span role="img" aria-label="Knuteloop" {...rest}>{mark}</span>;
  }

  return (
    <span
      role="img"
      aria-label="Knuteloop"
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4, ...(rest.style || {}) }}
      {...rest}
    >
      {mark}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        letterSpacing: 'var(--tracking-display)',
        fontSize: size,
        lineHeight: 1,
        color,
      }}>
        Knuteloop
      </span>
    </span>
  );
}
