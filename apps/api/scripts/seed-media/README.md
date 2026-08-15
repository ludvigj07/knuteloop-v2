# seed-media/ — egne bilder i dev-feeden

Slipp **JPG-bilder i stående format (9:16, f.eks. 900×1600)** rett i denne mappa,
og kjør:

```
pnpm --filter @knuteloop/api dev:seed-feed
```

Da brukes bildene dine i feeden i stedet for picsum-plassholderne — sortert på
filnavn (`01.jpg`, `02.jpg`, …), gjenbrukt i loop hvis det er færre enn 8.
Bytt en fil og kjør på nytt, så oppdateres feeden. Tom mappe → picsum-fallback.

## Regler (viktig)

- **Alt i denne mappa er gitignored** (unntatt denne README-en). Bilder av ekte
  mennesker skal ALDRI committes til repoet — samme regel som `docs/v1-screenshots/`.
- **Kun JPG** — seed-nøklene slutter på `.jpg`. Eksporter fra mobil som JPG.
- **Samtykke:** spør alle som er med på bildene før de brukes i demo/video —
  også kompiser. (v1-bildene fra piloten krever samtykke fra de avbildede før
  de kan brukes i markedsføring — enklere å ta nye.)

Fotoliste for salgsvideoen: `docs/video/fotoliste.md`.
