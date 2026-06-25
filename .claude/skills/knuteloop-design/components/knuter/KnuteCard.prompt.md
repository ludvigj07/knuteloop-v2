A single challenge ("knute") card for the catalog or feed — category glyph, title, description, and a row of chips (category / difficulty / points / status).

```jsx
<KnuteCard
  title="Spis 100 nuggets i en studietime"
  description="Fra St. Olav-listen."
  category="Generelle" difficulty="Medium" points={20}
  status="Tilgjengelig" onPress={() => {}}
/>
<KnuteCard title="Gullknute" gold points={30} difficulty="Hard" status="Godkjent" />
```

Pass `onPress` to make it tappable (sticker lift/press). `gold` flags a gullknute. Status maps to colored chips: Godkjent=green, Venter=amber, Avvist=red.
