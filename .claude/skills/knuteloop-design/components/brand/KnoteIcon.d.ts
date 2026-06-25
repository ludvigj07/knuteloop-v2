import React from 'react';

export type KnoteIconName =
  | 'knute'        // brand loop knot
  | 'generelle'    // category: general knuter
  | 'dobbel'       // category: double / partner knuter
  | 'alkohol'      // category: alcohol-themed
  | 'sex'          // category: flirt / dating
  | 'fordervett';  // category: mischief / needs judgement

export interface KnoteIconProps extends React.SVGProps<SVGSVGElement> {
  /** Which glyph to render. Default 'knute'. */
  name?: KnoteIconName;
  /** Pixel size (width; the brand loop keeps its 100:56 ratio). Default 24. */
  size?: number;
  /** Stroke width for the line glyphs. Default 1.8. */
  strokeWidth?: number;
}

/** Knuteloop's custom hand-drawn knot & category glyphs. Color via `currentColor`. */
export function KnoteIcon(props: KnoteIconProps): JSX.Element;
