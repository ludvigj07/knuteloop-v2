import React from 'react';
import { Chip } from '../core/Chip.jsx';
import { KnoteIcon } from '../brand/KnoteIcon.jsx';

const CATEGORY_ICON = {
  Generelle: 'generelle', Dobbelknuter: 'dobbel', Alkoholknuter: 'alkohol',
  Sexknuter: 'sex', 'Fordervett-knuter': 'fordervett',
};
const DIFF_TONE = { Lett: 'success', Medium: 'warning', Hard: 'danger' };
const STATUS = {
  Godkjent: { tone: 'success', label: 'Godkjent' },
  Venter: { tone: 'warning', label: 'Venter' },
  Avvist: { tone: 'danger', label: 'Avvist' },
  Tilgjengelig: { tone: 'neutral', label: 'Tilgjengelig' },
};

/**
 * KnuteCard — a single challenge ("knute") in the catalog or feed: title,
 * description, category, difficulty, points, status. Tappable sticker card.
 */
export function KnuteCard({
  title, description, category = 'Generelle', difficulty = 'Lett',
  points = 10, status = 'Tilgjengelig', gold = false, onPress, style, ...rest
}) {
  const st = STATUS[status] || STATUS.Tilgjengelig;
  const glyph = CATEGORY_ICON[category] || 'generelle';

  return (
    <div
      className="sticker"
      role={onPress ? 'button' : undefined}
      onClick={onPress}
      style={{
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)',
        background: 'var(--card)', cursor: onPress ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 44, flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: gold ? 'var(--tier-gold)' : 'var(--primary-bg)',
          color: gold ? 'var(--foreground)' : 'var(--primary)',
          border: '2px solid var(--foreground)',
        }}>
          <KnoteIcon name={glyph} size={24} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', lineHeight: 1.1, color: 'var(--text-strong)', margin: 0 }}>
            {gold && <span title="Gullknute" style={{ color: '#d6a429' }}>★ </span>}{title}
          </h4>
          {description && (
            <p style={{ marginTop: 4, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.45 }}>{description}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Chip tone="primary" icon={<KnoteIcon name={glyph} size={13} />}>{category}</Chip>
        <Chip tone={DIFF_TONE[difficulty] || 'neutral'}>{difficulty}</Chip>
        <Chip tone="accent">{points} poeng</Chip>
        <span style={{ flex: 1 }} />
        <Chip tone={st.tone} outline={status === 'Tilgjengelig'}>{st.label}</Chip>
      </div>
    </div>
  );
}
