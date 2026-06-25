import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic color. Default 'neutral'. Use success=Godkjent, warning=Venter, danger=Avvist. */
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
  /** Size. Default 'base'. */
  size?: 'sm' | 'base' | 'lg';
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  /** Transparent background, colored border + text only. */
  outline?: boolean;
  children: React.ReactNode;
}

/** Small pill label — categories, difficulty, points, submission status. */
export function Chip(props: ChipProps): JSX.Element;
