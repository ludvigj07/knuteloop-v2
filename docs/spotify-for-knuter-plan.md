# Plan: «Spotify for knuter» — mapper som hovedakse

> Lim dette inn i en ny Claude-chat for å starte arbeidet. Planen er selvstendig —
> den forutsetter ingen tidligere samtale. CLAUDE.md + `.claude/rules/*` lastes
> automatisk; dette dokumentet dekker det som er spesifikt for denne oppgaven.

## Målet (visjonen)
Knutebiblioteket skal fungere **som Spotify, bare for knuter**:
- **Biblioteket** = hele katalogen (bla/søk/filtrer).
- **Mappene** (`knute_folders`, f.eks. «Sport») = spillelistene som knutesjefen lager.
- **«+»** på en knute = «legg til i spilleliste».
- **Elevene** blar etter skolens **mapper** (ikke en fast meny).

## Beslutninger som ALLEREDE er tatt (ikke spør om disse på nytt)
1. **Mapper (`knute_folders`) er hovedaksen** alle blar etter. Den faste 5-kategori-enumen
   (`knuter.category`: Generelle/Dobbelknuter/Alkoholknuter/Sexknuter/Fordervett-knuter)
   **beholdes bak kulissene** (profil-ringer i `routes/me.ts` + badges leser den) men
   **skjules fra elev-siden**. Ikke slett `category`.
2. **«+» i biblioteket → velg mappe(r)** («add to playlist»), ikke auto-arkivering etter tema.

## Dagens arkitektur (les disse først)
- **Import = kopi** (ADR-0014): `apps/api/src/lib/library-import.ts`
  - `importLibraryKnute(tx, libraryKnuteId, {schoolId,userId})` — kopierer library-knute inn i
    skolens `knuter`, auto-arkiverer i en mappe etter `suggested_folder`, kaster **409** ved re-import.
  - `importLibraryPack(...)` — bulk; auto-lager tema-mapper. **La denne være urørt** (onboarding).
  - ⚠️ **LOAD-BEARING ORDERING**: alle `throw` MÅ skje **før** første skriving, fordi
    `tenantContext` committer transaksjonen selv ved kastet `HTTPException` (kommentert i fila).
    Valider alt (mapper finnes osv.) før du skriver.
- **Import-rute**: `POST /api/library/imports { libraryKnuteId }` i `apps/api/src/routes/library.ts`.
- **Mapper-API**: `apps/api/src/routes/folders.ts`
  - `GET /api/folders` (lesbar for alle medlemmer; returnerer id/name/icon/sortOrder/knuteCount)
  - `POST/PATCH/DELETE /api/folders` (knutesjef/admin)
  - `POST /api/folders/:id/knuter {knuteId}` + `DELETE /api/folders/:id/knuter/:knuteId` (medlemskap)
  - `GET /api/knuter?folderId=<uuid>` finnes (filtrer katalog til en mappe). `?all=1` for knutesjef.
- **Skjema**: `apps/api/src/db/schema/knute-folders.ts` — `knuteFolders` (har `icon`-kolonne) +
  `knuteFolderMemberships` (many-to-many, `unique(knuteId, folderId)`).
- **Mobil API-klient**: `apps/mobile/lib/api.ts` — `importLibraryKnute`, `fetchFolders`,
  `createFolder(name, icon?)`, `Folder` (har `icon`), `fetchKnuterByFolder`.
- **Bibliotek-skjerm**: `apps/mobile/app/admin/bibliotek.tsx` (`onAddRow`, `importKnute`-mutasjon,
  `useInfiniteQuery`). Rad: `apps/mobile/components/library/LibraryRow.tsx` («+»-knappen).
- **Cross-platform ark**: `apps/mobile/components/primitives/Sheet.tsx` — **BRUK DENNE**, ikke
  `@gorhom/bottom-sheet` (gorhom renderer ikke på react-native-web, og **Ludvig tester i nettleser**
  på `localhost:8081`). Mønster: se `apps/mobile/components/folder/CreateFolderSheet.tsx`.
- **Mappe-ikoner**: `FOLDER_ICON_KEYS` i `@knuteloop/shared` + `apps/mobile/lib/folder-icons.ts`
  (`folderIconFor(key)`, `folderIconKeys`). Lagt til i **PR #40** — sjekk om den er merget; hvis
  ja, bruk `folder.icon` på mappe-chips i PR-3.

## Arbeidet — 4 PR-er

### PR-1 (backend) ⚠️ broren reviewer — mappe-styrt + idempotent import
Ingen migrasjon (medlemskaps-tabellen finnes). Endre `importLibraryKnute`:
- Ny signatur: `importLibraryKnute(tx, libraryKnuteId, {schoolId,userId}, folderIds: string[] = [])`.
- Valider at alle `folderIds` tilhører skolen **før** skriving (load-bearing ordering); ellers `NotFoundError`.
- **Idempotent**: hvis knuten alt er importert, gjenbruk eksisterende `schoolLibraryImports.knuteId`
  (ikke kast 409). Hvis ny: kopier inn i `knuter` + skriv `schoolLibraryImports` (behold 23505-backstop).
- **Fjern auto-tema-arkivering** for enkel-import (erstattes av brukerens valg). `findOrCreateFolder`
  blir ubrukt → fjern den.
- Legg medlemskap i `folderIds` med dedupe: `insert(knuteFolderMemberships).values(...)
  .onConflictDoNothing({ target: [knuteFolderMemberships.knuteId, knuteFolderMemberships.folderId] })`.
- Returner `{ knuteId, alreadyImported, folderIds }`.
- **Rute**: `POST /api/library/imports { libraryKnuteId, folderIds?: string[] }`.
- **Mobil API-klient**: `importLibraryKnute(libraryKnuteId, folderIds?)` + ny `ImportKnuteResponse`.
- **Oppdater tester** i `apps/api/src/test/integration/library-import.test.ts`:
  - «files it in its folder» → importer MED `folderIds`, assert medlemskap der.
  - «409 on re-import» → nå **idempotent** (201 + `alreadyImported: true`, ingen 409).
  - «reuses an existing folder for a second knute» → fjern (auto-tema borte for enkel-import).
  - concurrent-testen «one wins 201, other 409» → begge lykkes nå; assert nøyaktig én kopi.
- Kjør `/backend-review` før PR.

### PR-2 (frontend) — «+» åpner «Legg til i …»-velger
- Ny `apps/mobile/components/library/AddToFolderSheet.tsx` på `Sheet`-primitiven:
  multi-select av skolens mapper (hent via `fetchFolders`, vis `folder.icon`) + «Ny mappe» inline
  (gjenbruk `createFolder`). Bekreft → `importLibraryKnute(libraryKnuteId, valgteFolderIds)`.
- `bibliotek.tsx`: «+» (og evt. detalj-arket) åpner denne i stedet for direkte-import.
  Behold optimistisk «imported»-flipp + Toast.
- Sensitive knuter (`isSensitiveKnute` i `lib/knute-ui.ts`): vis fortsatt advarsel i velgeren.

### PR-3 (frontend) — elev-katalogen blar etter mapper
- Finn elev-katalog-skjermen (fanen «Knuter» med kategori-glyf-filtrene + «Ta knute»-knappene —
  grep etter `Ta knute` eller kategori-filteret).
- Erstatt de 5 faste kategori-glyfene med **mappe-chips** (Alle + skolens mapper, med `folder.icon`).
- Filtrer via `GET /api/knuter?folderId=...` (legg til en student-variant i API-klienten om nødvendig;
  `fetchKnuterByFolder` finnes men bruker `all=1` — lag en uten `all` for elever).
- `category`-glyfene forsvinner fra elev-siden; `category` beholdes i data for profil-ringer/badges.

### PR-4 (docs) — ADR
- Kort ADR: «Mapper som primær akse» (justerer/utdyper ADR-0013 + ADR-0014). Oppdater
  `docs/adr/README.md`-indeksen. Reconcil evt. `.claude/rules/*` hvis de motsier.

## Slik jobber du (repo-spesifikt)
- Feature-branch → PR → CI grønn → merge. **Frontend-PR-er** kan du merge selv; **backend-PR-er**
  (PR-1) skal til **brorens review** — ikke auto-merge.
- `gh` CLI er installert. **Kjør `git push` og `gh pr create --base main` i SEPARATE kommandoer**
  (en hook blokkerer hvis «push» og «main» er i samme kommando).
- `.env` er hook-beskyttet — Claude kan ikke skrive den; be Ludvig hvis noe trengs.
- Verifiser: `pnpm typecheck`, `pnpm lint`, `pnpm --filter @knuteloop/api test` (krever Docker),
  `pnpm --filter @knuteloop/mobile test`.
- Test lokalt: `pnpm dev:all` (seeder DB + starter API + mobil). 186 library-knuter + 2 skoler seedes.
- Anbefalt rekkefølge: PR-1 → PR-2 (da kan du fylle «Sport» fra biblioteket) → PR-3 → PR-4.

## Definisjon av ferdig
Knutesjef kan bla biblioteket, trykke «+», velge én/flere mapper (eller lage en ny), og knuten havner
der. Elevene blar katalogen etter skolens mapper (med ikoner). Profil-ringer/badges virker fortsatt.
Alt grønt: typecheck, lint, API- + mobil-tester.
