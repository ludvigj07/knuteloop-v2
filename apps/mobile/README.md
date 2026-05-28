# @knuteloop/mobile

Minimal scaffold. Full Expo SDK 56 setup (expo, expo-router, react-native, etc.) comes in a follow-up step — this stub exists so the workspace structure is correct and `pnpm typecheck` passes from day one.

When ready to fully init:

```bash
cd apps/mobile
pnpm dlx create-expo-app@latest . --template default --no-install
pnpm install
```

Then iterate per `.claude/rules/frontend.md`.
