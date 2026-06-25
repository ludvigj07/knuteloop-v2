import React from 'react';

export interface LeaderRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 1-based rank. Ranks 1–3 get gold/silver/bronze medals. */
  rank: number;
  /** russenavn / display name. */
  name: string;
  /** Class group, e.g. "3STA". */
  group?: string;
  /** Total points. Formatted nb-NO (space thousands). */
  points: number;
  /** russType for the avatar ring. Default 'blue'. */
  russType?: 'red' | 'blue';
  /** Avatar photo URL. */
  photoUrl?: string;
  /** Highlight as the signed-in user (yellow tint). */
  highlight?: boolean;
  /** Show the rank title under the name (else show group). Default true. */
  showTitle?: boolean;
}

/** One row of the toppliste (leaderboard). Exports `getLeaderboardTitle(rank)` too. */
export function LeaderRow(props: LeaderRowProps): JSX.Element;
export function getLeaderboardTitle(rank: number): string;
