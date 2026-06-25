import React from 'react';

export interface BadgeMedallionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon node inside the medallion (KnoteIcon, Lucide, etc.). */
  icon?: React.ReactNode;
  /** Achievement name (e.g. "Knutesamler"). */
  name?: React.ReactNode;
  /** Tier — drives the metallic ring + glow. Default 'bronze'. */
  tier?: 'bronze' | 'sølv' | 'gull' | 'diamant';
  /** Small caption after the tier (e.g. progress "8/15"). */
  caption?: React.ReactNode;
  /** Desaturated locked state. */
  locked?: boolean;
  /** Medallion diameter in px. Default 72. */
  size?: number;
}

/** Achievement badge with a tiered metallic ring (bronze/sølv/gull/diamant). */
export function BadgeMedallion(props: BadgeMedallionProps): JSX.Element;
