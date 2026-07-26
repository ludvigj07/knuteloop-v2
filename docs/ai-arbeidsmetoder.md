# AI-arbeidsmetoder — det som faktisk har funket

Erfaringene fra ett år med AI-assistert bygging av Knuteloop (Claude Code +
Codex). Skrevet for nye bidragsytere. Ikke teori — dette er metodene som har
spart oss mest tid og fanget flest feil.

## 1. Snakk før du koder

Den viktigste. Beskriv målet, la AI-en foreslå en plan, juster planen — *så*
kod. Fem minutter prat sparer en time i feil retning.

Motsatsen («bygg hele featuren i ett prompt») gir alltid noe som *ser* ferdig
ut, men er feil på tre måter du oppdager senere.

**I praksis:** «Jeg vil bygge X. Foreslå en plan først — ikke skriv kode ennå.»
Les planen. Er den for stor: be om et mindre første steg.

## 2. Små biter

Én skjerm eller ett problem per branch/PR. Ikke fordi det er «riktig prosess»,
men fordi både mennesker og AI mister oversikten på store differ. En liten PR
kan du faktisk *lese* og forstå. v1s største feil var én fil på 4167 linjer.

## 3. To par øyne — der det andre er en annen AI

Codex bygger → Claude reviewer PR-en med friske øyne (eller omvendt). AI-er er
selvsikre også når de tar feil; en uavhengig gjennomgang fanger overraskende
mye. Dette skjer automatisk her: alle PR-er får review før merge.

## 4. Tester i samme PR — aldri «senere»

«Senere» finnes ikke. Be AI-en teste *oppførsel* («når jeg trykker X skjer Y»),
ikke implementasjonsdetaljer. Ingen snapshot-tester.

## 5. Kjør sjekkene før du sier deg ferdig

`pnpm typecheck && pnpm lint && pnpm test` — alltid. Og *se* på skjermen i
nettleseren: smal skjerm (320–360 px), 130 % zoom. AI-en kan påstå at ting
funker; verifiser selv. «Testene er grønne» og «det ser riktig ut» er to
forskjellige sjekker — gjør begge.

## 6. Skriv ned beslutninger og overleveringer

- **ADR-er** (`docs/adr/`): *hvorfor* vi valgte noe. Gjør at AI-en (og
  fremtidige oss) slutter å foreslå ting vi allerede har forkastet.
- **Handoffs** (`docs/handoffs/`): *hvor vi sto* da økta sluttet. Gjør at neste
  økt starter på sekunder i stedet for en time med arkeologi.

Begge finnes fordi verken AI-økter eller mennesker med militærpauser har
hukommelse. Skriv som om leseren husker ingenting — det stemmer.

## 7. Ikke godkjenn ting du ikke forstår

Be AI-en forklare diffen på 30 sekunder før du sier ja. Gir ikke forklaringen
mening, er det et rødt flagg — enten for koden eller for forståelsen din. Begge
deler er verdt å stoppe for. Spør «forklar som om jeg er ny» — det er gratis.

## 8. Gi AI-en regler, ikke bare oppgaver

`CLAUDE.md` og `AGENTS.md` er halve grunnen til at repoet holder kvalitet —
AI-en er bare så god som instruksjonene den får. Når dere lærer noe nytt
(«aldri gjør X», «alltid bruk Y»), skriv det inn i regelfila i stedet for å
huske det til neste gang. Regelfiler er hukommelsen som overlever økter.

---

**Kortversjonen:** plan før kode · små biter · uavhengig review · tester med én
gang · verifiser selv · skriv ned hvorfor og hvor · forstå det du godkjenner ·
oppdater reglene når du lærer noe.
