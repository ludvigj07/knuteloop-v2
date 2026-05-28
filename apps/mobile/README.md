# @knuteloop/mobile

Native iOS+Android app via Expo SDK 52. Currently one screen — the per-school knuter list — that fetches from the real backend.

## Quick start

```bash
# 1. Backend må kjøre. Fra rota:
pnpm --filter @knuteloop/api dev:setup    # ferske testdata (en gang)
pnpm dev                                   # i en terminal — bakgrunns-API

# 2. Hent en dev-token:
pnpm --filter @knuteloop/api dev:token     # i en annen terminal
# Kopier f.eks. Loke (knutesjef)-tokenet.

# 3. Lim inn i apps/mobile/.env:
#    EXPO_PUBLIC_DEV_TOKEN=eyJ...
#    EXPO_PUBLIC_API_URL=...  (se under for hvilken som passer)

# 4. Start mobil-appen:
pnpm --filter @knuteloop/mobile start
```

## Hvor backend-en finnes (avhenger av hvor du kjører)

| Hvor du kjører appen | EXPO_PUBLIC_API_URL |
|---|---|
| Expo Web (åpner i nettleser, trykk `w` i terminalen) | `http://localhost:3000` |
| iOS Simulator (kun macOS) | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| Fysisk telefon med Expo Go (QR) | `http://<din-LAN-IP>:3000` (finn med `ipconfig`) |

For fysisk telefon må Windows Defender Firewall tillate inngående trafikk på port 3000 — én engangsaksjon første gang.

## Bevise at dataene er ekte

Kjør appen, så endre noe i databasen og se skjermen oppdatere seg:

```powershell
# Mens appen kjører, fra en annen terminal:
PGPASSWORD=postgres "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  -h localhost -U postgres -d knuteloop_dev `
  -c "UPDATE knuter SET title = 'BEVIS PÅ EKTE DATA' WHERE title = 'Spis frokost under pulten';"
```

Trekk ned på listen i appen for å refreshe (pull-to-refresh er bygget inn via TanStack Query). Tittelen oppdaterer seg. Bekreftet — dataene kommer fra databasen, ikke fra appen.

## Filer

```
apps/mobile/
├── app/
│   ├── _layout.tsx       # root layout: QueryClientProvider + Stack navigator
│   └── index.tsx         # the knuter list screen (loading / error / data)
├── lib/
│   ├── theme.ts          # design tokens (colors, spacing, fontSize, radius)
│   └── api.ts            # typed fetch client, reads EXPO_PUBLIC_* env vars
├── app.json              # Expo config
├── babel.config.js
├── metro.config.js       # pnpm workspace symlink fix
├── package.json
├── tsconfig.json
└── .env.example          # template (.env is gitignored)
```

## Vanlige problemer

| Feilmelding | Hva det betyr | Fix |
|---|---|---|
| "EXPO_PUBLIC_DEV_TOKEN er ikke satt" | Glemte å fylle inn .env | Rediger `apps/mobile/.env`, restart `pnpm start` |
| "Kunne ikke nå http://..." | API ikke kjører, eller feil URL for plattformen | Sjekk at `pnpm dev` kjører + se tabellen over |
| 401 "Token utløpt" | Tokenet er over 15 min gammelt | Re-kjør `pnpm dev:token`, oppdater .env, restart Expo |
| Hvit skjerm forever | Metro caching | Trykk `r` i Expo-terminalen for å reload |
