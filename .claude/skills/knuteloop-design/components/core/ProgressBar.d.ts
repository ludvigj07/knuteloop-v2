import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value. */
  value?: number;
  /** Max value. Default 100. */
  max?: number;
  /** Fill color. Default 'primary'. */
  tone?: 'primary' | 'accent' | 'success';
  /** Track height in px. Default 12. */
  height?: number;
  /** Show a label row above the track. */
  showLabel?: boolean;
  /** Label text (with showLabel). */
  label?: React.ReactNode;
}

/** Progress track + fill — badge-tier progress, folder completion, onboarding steps. */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
