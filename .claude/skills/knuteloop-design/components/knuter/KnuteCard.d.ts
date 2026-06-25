import React from 'react';

/**
 * Props for a single challenge ("knute") card.
 * @startingPoint section="Knuter" subtitle="Challenge card — title, category, points, status" viewport="700x230"
 */
export interface KnuteCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Challenge title (bokmål). */
  title: string;
  /** Short description. */
  description?: string;
  /** Folder/category — drives the glyph. One of the five folders. */
  category?: 'Generelle' | 'Dobbelknuter' | 'Alkoholknuter' | 'Sexknuter' | 'Fordervett-knuter';
  /** Difficulty. Default 'Lett'. */
  difficulty?: 'Lett' | 'Medium' | 'Hard';
  /** Base points. Default 10. */
  points?: number;
  /** Submission/availability status. Default 'Tilgjengelig'. */
  status?: 'Tilgjengelig' | 'Venter' | 'Godkjent' | 'Avvist';
  /** Mark as a gullknute (gold). */
  gold?: boolean;
  /** Tap handler — makes the card interactive. */
  onPress?: () => void;
}

/** A single challenge ("knute") card for the catalog or feed. */
export function KnuteCard(props: KnuteCardProps): JSX.Element;
