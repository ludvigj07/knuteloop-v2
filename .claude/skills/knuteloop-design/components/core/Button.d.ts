import React from 'react';

/**
 * Props for the Knuteloop pill button.
 * @startingPoint section="Core" subtitle="Pill button — sticker treatment" viewport="700x180"
 */
export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Visual style. Default 'primary'. */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive';
  /** Size. Default 'base'. */
  size?: 'sm' | 'base' | 'lg';
  /** Icon node before the label. */
  iconLeft?: React.ReactNode;
  /** Icon node after the label. */
  iconRight?: React.ReactNode;
  /** Stretch to container width. */
  fullWidth?: boolean;
  disabled?: boolean;
  /** Show a spinner and block presses. */
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

/**
 * Pill button with the Knuteloop sticker treatment.
 * `accent` is the loud yellow hero CTA (uppercase display); `primary` is royal blue.
 */
export function Button(props: ButtonProps): JSX.Element;
