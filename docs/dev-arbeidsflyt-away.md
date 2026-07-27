# Dev-arbeidsflyt mens Ludvig er borte (28. juli – ~18. aug 2026)

Kort notat til **august-Ludvig**: sånn er repoet rigget mens du var i militæret,
og sånn nuller du det ut når du er tilbake.

## Hvorfor

Du er borte ~3 uker uten PC. Brage koder frontend (sannsynligvis bare ~1 uke,
han er på ferie). For at han skal kunne **stable** arbeid — bygge oppgave B på
toppen av oppgave A uten å vente på at et menneske merger — jobber han på en
integrasjonsbranch kalt `dev` i stedet for `main`.

Dette løser v1-smerten (Linus' far merget, det tok dager, du gjorde dobbeltarbeid,
alt ble rotete): Brage self-merger sine egne PR-er inn i `dev` så snart CI er
grønn. Han venter aldri på noen.

## Oppsettet (gjort 28. juli)

- **`dev`** er opprettet fra `main` og er nå **default branch**. Alt (PR-er,
  `gh pr create`, GitHub-UI) peker dit automatisk.
- **CI** kjører på PR-er mot både `main` og `dev` (`.github/workflows/ci.yml`).
- **`dev`** har lett beskyttelse: PR + grønn CI kreves, men 0 godkjenninger —
  Brage merger selv.
- **`main`** er fryst: beskyttet av rulesettet `protect-default-branch`
  (retargetet til `refs/heads/main` så det overlever default-byttet). Ingen
  jobber mot main mens du er borte.
- **`AGENTS.md`** har et midlertidig banner øverst som forteller Codex å jobbe
  mot `dev`.

## Sånn nuller du det ut (når du er tilbake)

1. **Kjør `/comeback`** — vanlig oppstart etter pause.
2. **Gå gjennom `dev` commit-for-commit** sammen med Claude. Hver squash-merge i
   `dev` er én issue/PR — små, lesbare biter. Kjør gjerne `/backend-review` hvis
   noe overraskende har snike seg inn (skal være rent frontend).
3. **Merge `dev` → `main`:** åpne PR `dev` → `main`, CI grønn, squash/merge.
   (Du er admin — ingen godkjenning kreves på main.)
4. **Sett `main` tilbake som default branch** (GitHub → Settings → Branches, ett
   klikk). Rulesettet peker allerede eksplisitt på `main`, så det trenger ingen
   endring.
5. **Fjern det midlertidige banneret** øverst i `AGENTS.md` (seksjonen «⏳
   TEMPORARY …»).
6. **Slett `dev`-branchen** når den er merget (valgfritt), og **slett denne
   fila** (`docs/dev-arbeidsflyt-away.md`).

## Hvis noe skjærer seg mens du er borte

Alt Brage gjør lander i `dev`, ikke `main` — så verste fall reverterer dere en
commit i `dev` sammen i august. `main` er urørt uansett. Ingen krise er mulig
her; det er hele poenget med oppsettet.
