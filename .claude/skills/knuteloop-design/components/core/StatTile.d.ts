import React from 'react';

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The big number/value (e.g. 285, "7", "#3"). */
  value: React.ReactNode;
  /** Label below the value (e.g. "Poeng", "Streak"). */
  label: React.ReactNode;
  /** Optional icon above the value. */
  icon?: React.ReactNode;
  /** Fill. Default 'card'. */
  tone?: 'card' | 'primary' | 'accent' | 'soft';
  /** Text alignment. Default 'left'. */
  align?: 'left' | 'center';
}

/** Compact stat readout — points, streak, rank, completed knuter. Numbers in the mono face. */
export function StatTile(props: StatTileProps): JSX.Element;
