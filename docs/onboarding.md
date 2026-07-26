# Onboarding — ny utvikler i Knuteloop

Skrevet for Brage (juli 2026), men gjelder alle som blir med. Målet: fra null til
kjørende app på egen maskin, og forstå hvordan vi jobber — uten å måtte spørre
Ludvig om alt.

---

## 1. Hva Knuteloop er (30 sekunder)

En app som digitaliserer russeknuter: Vg3-elever fullfører utfordringer, sender
inn bevis (foto), knutesjefen godkjenner med ett trykk. Poeng, toppliste, sosial
feed. Hver skole er sin egen isolerte verden (tenant). v1 ble validert på én
skole i 2026; v2 er produksjonsversjonen som skal tåle 100+ skoler i 2027.

Les mer når du trenger det:

| Spørsmål | Dokument |
|---|---|
| Hvordan henger alt sammen? | `docs/architecture.md` |
| Hva betyr russenavn/knutemappe/...? | `docs/glossary.md` |
| Hvorfor er X valgt? | `docs/adr/README.md` (23 beslutninger med begrunnelse) |
| Hva gjorde v1? | `docs/v1-spec.md` |
| Hvor sto vi sist økt? | nyeste fil i `docs/handoffs/` |

## 2. Hvordan vi jobber

- **Frontend (`apps/mobile`) er din bane.** Backend (`apps/api`) har strengere
  sikkerhetskrav (multi-tenant, RLS, GDPR for mindreårige) og går gjennom Claude
  Code med egen review-pipeline. Codex-reglene står i `AGENTS.md` — les den.
- **Aldri direkte til `main`.** Branch → PR → grønn CI → squash merge. Branch
  protection håndhever dette for alle, også Ludvig.
- **Små PR-er.** Én skjerm eller ett problem per PR. Claude reviewer alle PR-er.
- **AI-arbeidsmetodene** vi har hatt suksess med står i
  `docs/ai-arbeidsmetoder.md` — verdt 5 minutter.
- Beslutninger om arkitektur, design-retning og produkt tas av Ludvig. Er han
  utilgjengelig (militæret): skriv spørsmålet ned i PR-en eller et notat, og
  bygg videre på noe annet i mellomtiden.

## 3. Sett opp maskinen (Windows)

### 3.1 Verktøy

1. **Git** — `winget install Git.Git`
2. **Node 22 LTS** — fra [nodejs.org](https://nodejs.org) (velg 22.x), eller
   `winget install OpenJS.NodeJS.LTS`
3. **pnpm** — `corepack enable pnpm` (følger med Node)
4. **PostgreSQL 17** — `winget install PostgreSQL.PostgreSQL.17` eller
   installeren fra postgresql.org. Under installasjonen setter du et passord for
   superbrukeren `postgres` — **husk det**, du trenger det i steg 3.3.
5. *(Valgfritt, kun for backend-tester)* **Docker Desktop** — API-ets
   integrasjonstester bruker testcontainers. For frontend-arbeid trenger du det
   ikke.

### 3.2 Klon og installer

```bash
git clone https://github.com/ludvigj07/knuteloop-v2.git
cd knuteloop-v2
pnpm install
```

### 3.3 Lokal API-konfig

Kopier malen og juster passordet:

```bash
cp apps/api/.env.example apps/api/.env
```

Åpne `apps/api/.env` i en teksteditor. Alt har fungerende standardverdier for
dev — det eneste du kanskje må endre er passordet i `SUPERUSER_DATABASE_URL`
slik at det matcher det du valgte da du installerte Postgres:

```
SUPERUSER_DATABASE_URL=postgres://postgres:DITT_PASSORD@localhost:5432/postgres
```

`.env` er gitignorert og skal ALDRI committes. Ingen ekte hemmeligheter finnes
i dev-oppsettet — auth er en dev-stub og bilder lagres lokalt på disk.

### 3.4 Databasen

```bash
pnpm dev:setup
```

Dette dropper og gjenskaper `knuteloop_dev`, kjører alle migrasjoner og seeder
to skoler med brukere og knuter. **Å kjøre den på nytt SLETTER dev-databasen**
— det er meningen (forutsigbar starttilstand). Kjør den igjen når seeden endres
etter en `git pull`.

### 3.5 Start alt

```bash
pnpm dev:all
```

Starter API + Expo samtidig (kjører `dev:setup` først). Åpne
`http://localhost:8081` i nettleseren og velg **«Bytt bruker (dev)»** for å
logge inn som en seedet bruker.

### 3.6 Verifiser

```bash
pnpm typecheck && pnpm lint
pnpm --filter mobile test    # frontend-testene (full `pnpm test` krever Docker)
```

Alle grønne? Da er du klar.

## 4. Vanlige problemer

- **`DATABASE_URL is not set`** → du mangler `apps/api/.env` (steg 3.3).
- **`password authentication failed for user "postgres"`** → passordet i
  `SUPERUSER_DATABASE_URL` matcher ikke Postgres-installasjonen din.
- **Port 5432 opptatt** → en annen Postgres kjører allerede; stopp den, eller
  endre porten i begge URL-ene i `.env`.
- **`pnpm test` henger/feiler på API-testene** → Docker Desktop kjører ikke.
  For frontend-arbeid: `pnpm --filter mobile test`.
- **Expo-web viser gammel kode** → hard refresh (Ctrl+Shift+R); sjekk at
  terminalen ikke viser bundle-feil.

## 5. Første oppgave-mønster

1. `git checkout main && git pull`
2. `git checkout -b feat/<kort-navn>`
3. Snakk med AI-en om planen FØR koding (se `docs/ai-arbeidsmetoder.md` §1)
4. Bygg smått, test i nettleseren på smal skjerm (320–360 px) og 130 % zoom
5. `pnpm typecheck && pnpm lint && pnpm --filter mobile test`
6. Push, åpne PR, vent på grønn CI + review
