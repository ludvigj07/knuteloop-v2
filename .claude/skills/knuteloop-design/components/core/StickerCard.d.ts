import React from 'react';

/**
 * Props for the base Knuteloop card surface.
 * @startingPoint section="Core" subtitle="Sticker surface — the base card" viewport="700x240"
 */
export interface StickerCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Element/tag to render. Default 'div'. Use 'button' for interactive cards. */
  as?: keyof JSX.IntrinsicElements;
  /** Inner padding. Default 'lg'. */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Corner radius. Default 'lg'. */
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  /** Adds hover-lift / press-flat interaction. */
  interactive?: boolean;
  /** Surface fill. Default 'card' (white). */
  tone?: 'card' | 'soft' | 'primary' | 'accent';
  children: React.ReactNode;
}

/** The base Knuteloop card surface — white, 2px ink border, hard offset shadow. */
export function StickerCard(props: StickerCardProps): JSX.Element;
