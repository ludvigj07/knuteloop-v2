One row of the toppliste (leaderboard) — rank chip (gold/silver/bronze for top 3), avatar with russType ring, russenavn + rank title, and points (formatted nb-NO).

```jsx
<LeaderRow rank={1} name="Emil Baka" group="3PBA" points={315} russType="blue" />
<LeaderRow rank={3} name="Sofie Sprint" group="3STA" points={285} russType="red" highlight />
```

Also exports `getLeaderboardTitle(rank)` for the v1 rank-title ladder (O' Store Knutemester … Knutekatastrofen). `highlight` tints the signed-in user's row yellow.
