Achievement badge with a tiered metallic ring — bronze / sølv / gull / diamant. Knuteloop has 7 achievements, each with 4 tiers.

```jsx
<BadgeMedallion icon={<KnoteIcon name="knute" size={26} />} name="Knutesamler" tier="gull" caption="15/15" />
<BadgeMedallion icon="🍔" name="Matmodus" tier="bronze" locked />
```

`tier` sets the ring gradient + glow (gull and diamant glow). `locked` desaturates. Pass an `icon` node and `name`; `caption` is good for progress counts.
