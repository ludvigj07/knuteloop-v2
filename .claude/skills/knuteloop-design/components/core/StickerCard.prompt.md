The base Knuteloop surface — white card, 2px ink border, hard offset "sticker" shadow on warm paper. Everything boxed sits on one of these.

```jsx
<StickerCard>Innhold</StickerCard>
<StickerCard interactive as="button" onClick={...}>Trykkbart kort</StickerCard>
<StickerCard tone="primary" radius="xl">Fremhevet panel</StickerCard>
```

`interactive` adds the lift-on-hover / press-flat feel (use for tappable rows/cards). `tone`: `card | soft | primary | accent`. Control `padding` and `radius` via tokens.
