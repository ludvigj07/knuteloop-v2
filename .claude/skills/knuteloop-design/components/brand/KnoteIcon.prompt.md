Knuteloop's custom hand-drawn knot and challenge-category glyphs — use for category tags, the brand loop, and anywhere a knute is represented; pair with Lucide for generic UI icons.

```jsx
<KnoteIcon name="alkohol" size={22} />
<span style={{ color: 'var(--primary)' }}><KnoteIcon name="knute" size={40} /></span>
```

Names: `knute` (brand loop, default — uses a 100×56 ratio), `generelle`, `dobbel`, `alkohol`, `sex`, `fordervett` (the five challenge folders). Color is inherited from `currentColor`, so set `color` on a parent or pass via style. Stroke glyphs accept `strokeWidth` (default 1.8).
