Knuteloop's pill button with the signature sticker treatment (2px ink border + hard offset shadow that lifts on hover, presses flat on click).

```jsx
<Button variant="accent" size="lg">Send inn knute</Button>
<Button variant="primary">Logg inn med Vipps</Button>
<Button variant="secondary" iconLeft={<KnoteIcon name="knute" size={18} />}>Se knuter</Button>
<Button variant="ghost">Avbryt</Button>
```

Variants: `accent` (loud yellow hero CTA, uppercase Bricolage — use once per screen), `primary` (royal blue), `secondary` (white sticker), `ghost` (text only), `destructive`. Sizes `sm | base | lg`. Supports `iconLeft`/`iconRight`, `fullWidth`, `loading`, `disabled`.
