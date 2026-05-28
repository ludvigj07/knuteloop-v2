# Anti-patterns — what NOT to do

A reference list of things Claude should refuse, push back on, or rewrite. Many of these are mistakes that look reasonable on the surface but compound badly over a 10-month project.

When you spot one of these in proposed code, refuse politely and propose the correct alternative.

---

## Backend

| ❌ Don't | ✅ Do | Why |
|---|---|---|
| `c.req.json()` without validation | `zValidator('json', schema)` | Unvalidated input is the #1 source of runtime bugs and security holes. |
| `c.json({ error: '...' }, 500)` from a handler | `throw new <Typed>Error(...)` and let `app.onError` format | Single source of error formatting. Includes requestId, consistent shape. |
| `sql.raw(\`...${userInput}...\`)` | `sql\`... ${userInput} ...\`` (parameterized) | `sql.raw` with interpolation is SQL injection. |
| `console.log` in server code | `logger.info({ field }, 'message')` | Structured logs only. console.log isn't redacted, isn't parseable, doesn't ship to log aggregator. |
| `process.env.X` outside `config.ts` | `import { config } from '../config'` | Single source of typed env. Misspelled env var fails at boot, not at runtime. |
| Forgetting `WHERE school_id = ?` because "RLS will catch it" | Always include both | Defense in depth. RLS is the safety net, not the primary guard. |
| `db.transaction` for a single INSERT | Just `db.insert(...)` | Each statement is already atomic in Postgres. Transactions for multi-statement only. |
| `for ... await` with DB calls inside | `db.query.X.findMany({ with: { Y: true } })` | N+1 query → terrible perf at any scale > toy. |
| Adding a column "while I'm here" without a migration plan | Generate, classify via `/migration-plan`, apply | Drift between schema and migrations is the #1 source of "it works on my machine." |
| `eas build --profile production` because you assumed it's safe | Confirm with Ludvig first | Costs money + triggers app store review. Never silently. |
| Creating a new endpoint without rate limit | Default rate limit applies via group middleware | Open endpoints get abused fast. |
| Catching errors with empty catch blocks | Either handle explicitly or let bubble to `app.onError` | Silent failures are worse than loud crashes. |
| Mixing async/await and `.then()` in the same function | Pick one (almost always async/await) | Readability + error propagation gets weird otherwise. |

## Database

| ❌ Don't | ✅ Do | Why |
|---|---|---|
| `enableRLS()` without `FORCE` migration | Both, always | Without FORCE, the table owner silently bypasses policies. Most common RLS bug. |
| `pgPolicy(... to: ALL)` (no role specified) | `to: 'app_role'` | Without a role, the policy applies broader than intended. |
| `CREATE INDEX` without `CONCURRENTLY` | `CREATE INDEX CONCURRENTLY` | Non-concurrent locks the table against writes. |
| `DROP COLUMN` directly | Three-step: deprecate writes → ship → drop in next migration | DROP COLUMN is irreversible and may break in-flight code. |
| `ALTER COLUMN TYPE` without checking what it does | `/migration-plan` first | Some conversions are instant; some rewrite the whole table. |
| Storing dates as `TEXT` | `timestamp with time zone` | Timezone bugs eat months of life. |
| Storing money as `FLOAT` / `REAL` | `numeric(12, 2)` or `integer` (cents) | Floating-point dollars/kr will produce wrong totals. We don't take payments in v2 but the rule stands for sponsor payouts later. |
| Skipping `school_id` from a composite index because "we only query by user" | Always lead the index with `school_id` | RLS adds it to every query — without it in the index, Postgres uses sequential scan. |
| `drizzle-kit push` in any environment with real data | `drizzle-kit generate` + `migrate` | Push is unaudited. |
| Editing a committed migration file | Generate a NEW migration that fixes the issue | Committed migrations are immutable — other environments may have applied them. |

## Frontend

| ❌ Don't | ✅ Do | Why |
|---|---|---|
| `useEffect(() => { fetch(...).then(setData) }, [])` | `useQuery({ queryKey, queryFn })` | TanStack Query handles caching, retry, loading state, errors. useEffect+fetch is reinventing it badly. |
| `<TouchableOpacity>` or `<TouchableHighlight>` | `<Pressable>` (the project primitive) | The project primitive includes haptic + scale animation + accessibility props. |
| `<View>` and `<Text>` from React Native directly | `<Stack>` and `<Text>` from `components/primitives/` | Project primitives accept design tokens. Raw views accept arbitrary styles → drift. |
| Hardcoded `color: '#FF0000'` in a component | `color: colors.error` (imported from `lib/theme`) | One file owns colors. Dark mode + brand changes work via theme. |
| `<FlatList>` for long lists | `<FlashList>` (`@shopify/flash-list`) | Significantly better perf on long lists. |
| `<Image source={...}>` (React Native's) | `<Image>` from `expo-image` | Better cache, faster decode, supports `blurhash` placeholder. |
| Inline functions as props (`<X onPress={() => doThing(id)} />`) on long lists | `useCallback` + stable reference | Forces re-render of list items every parent render. |
| `Switch`, `Slider` from `react-native` with default styling | Custom-styled primitives | Brand consistency. Default switches look generic. |
| English UI strings | Bokmål, hardcoded | All UI is bokmål in v2. |
| Snapshot tests | Behavioral tests with `@testing-library/react-native` | Snapshot tests break on every CSS tweak and add no signal. |
| `<Text style={{...}}>` with raw spacing | Use spacing token via `<Stack padding="base">` or theme | One source of spacing. |
| `Alert.alert(...)` for non-destructive confirmations | A custom toast or bottom sheet | Native `Alert` looks generic and breaks app flow. |
| `console.log` left in production builds | Strip via a debug utility / Babel transform | Performance + leaks of dev info. |
| `any` type without justification | `unknown` + narrow, or a real type | `any` defeats TypeScript. Inline `// reason:` comment required if truly necessary. |
| Importing all icons from `lucide-react-native` (`import * as Icons`) | Per-icon imports (`import { Camera } from 'lucide-react-native'`) | Tree-shaking. Bundle size matters on mobile. |

## Security

| ❌ Don't | ✅ Do | Why |
|---|---|---|
| Custom JWT crypto or password hashing | `jose` for JWT, `bcrypt` (cost ≥ 12) for passwords | Custom crypto is how everyone gets hacked. |
| Storing raw refresh tokens in DB | `sha256(token)` only | If the DB is dumped, raw tokens = persistent access. Hashed = one-way. |
| Logging `email`, `russenavn`, `fullName`, `token`, `password` | Use Pino redact paths | PII in logs = GDPR incident. |
| Accepting `tenantId` from request body | Look up the school server-side from URL or session | Client-supplied tenant = trivial cross-tenant access. |
| Trusting the `russenavn` from a login request | Read from the allowlist row server-side | The server is the source of truth, not the client. |
| Returning DB error messages to clients | Return generic `Internal Server Error` + requestId | DB error messages leak schema details. |
| Listing all users as a non-admin operation | Admin-role required for user enumeration | Enumeration attacks. |
| `Bearer ${token}` in URL query string | Always in `Authorization` header | URLs get logged (proxies, CDNs). Headers don't. |
| Storing secrets in the repo even temporarily | Always in `.env*` (gitignored) | Once committed, even if reverted, it's leaked. |
| Skipping rate limits on auth endpoints | Stricter than other endpoints (10/15min for login) | Credential stuffing is the most common attack. |

## Process

| ❌ Don't | ✅ Do | Why |
|---|---|---|
| `git push origin main` | Feature branch → PR → CI green → squash merge | History stays clean. Hooks catch issues before main. |
| `git push --force` to a shared branch | `git push --force-with-lease` to your own feature branch only | Force-push destroys history. With-lease at least checks no one else pushed. |
| "Just one more feature" before committing | Commit small, focused changes | Big commits are hard to review and impossible to revert cleanly. |
| Skipping `/handoff` because "I'll remember" | Always handoff at session end | After 2-week military leaves, you won't remember. |
| Skipping `/comeback` because "I just have a quick fix" | Always comeback after ≥24h gap | The "quick fix" is when state-of-the-world surprises bite. |
| Adding a dependency for a 20-line problem | Write the 20 lines | Each dep is a future security/maintenance burden. |
| Letting `pnpm audit` warn about CVEs | Resolve weekly | The window between disclosure and exploit is small. |
| Merging without `/backend-review` on backend changes | Run it. Always. | The whole point of this Claude Code setup is to catch what Ludvig can't. |

## When in doubt

Refuse, propose alternatives, ask Ludvig. The cost of asking is small. The cost of a security or data-residency bug is the entire project.
