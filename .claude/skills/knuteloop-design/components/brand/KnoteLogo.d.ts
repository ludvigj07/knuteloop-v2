import React from 'react';

export interface KnoteLogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** 'full' = loop mark + wordmark; 'mark' = loop only. Default 'full'. */
  variant?: 'full' | 'mark';
  /** Color treatment. 'ink' (navy) on light, 'primary' (royal blue), 'inverse' on dark/photo. Default 'ink'. */
  tone?: 'ink' | 'primary' | 'inverse';
  /** Wordmark font-size in px; the mark scales relative to it. Default 28. */
  size?: number;
}

/** The Knuteloop brand lockup — loop knot mark plus wordmark. */
export function KnoteLogo(props: KnoteLogoProps): JSX.Element;
