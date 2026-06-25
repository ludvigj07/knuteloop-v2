import React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Display name — used for initials and the deterministic gradient. */
  name?: string;
  /** Photo URL. Falls back to initials if omitted. */
  src?: string;
  /** Pixel diameter. Default 48. */
  size?: number;
  /** Ring color by russType. 'red'=rødruss, 'blue'=blåruss, 'accent', or 'none'. Default 'none'. */
  ring?: 'none' | 'red' | 'blue' | 'accent';
  /** Rounded-square instead of circle. */
  square?: boolean;
}

/** A russ avatar — photo or initials on a deterministic gradient, optional russType ring. */
export function Avatar(props: AvatarProps): JSX.Element;
