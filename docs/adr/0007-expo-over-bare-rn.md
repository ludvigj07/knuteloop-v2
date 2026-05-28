# ADR-0007: Expo (managed) over bare React Native

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

We're building native iOS and Android apps. The team is one person (Ludvig) with no native development experience. The product needs:

- Camera access (submit a knute)
- Photo picker
- Push notifications (knutesjef approval signal)
- Haptics (polish — see frontend rules)
- Biometric or secure storage (tokens)
- Background image upload (for submissions)
- Standard navigation, lists, animations

We do NOT need (now or in any foreseeable v2 scope):
- Bluetooth
- AR / camera-pipeline manipulation beyond standard capture
- Custom native code that doesn't have an Expo equivalent
- Apple Watch / WearOS

## Decision

Build with **Expo SDK 56+** in the **managed workflow**, with **EAS Build** for native binaries and **EAS Update** for over-the-air JS updates.

Use Expo Router for navigation.

## Alternatives considered

- **Bare React Native.** Full control over Xcode/Gradle, all native APIs available. Rejected: ops burden too high — every iOS/Android version bump means manually upgrading the native projects, fixing native library versions, etc. We don't need anything bare RN can do that Expo can't.

- **Flutter.** Excellent UI tooling, single language (Dart). Rejected: TypeScript is shared with the backend (`packages/shared` types flow both ways); Dart would mean a second language stack. Flutter is faster on raw rendering but our app isn't pixel-heavy.

- **SwiftUI + Jetpack Compose (truly native, two codebases).** Best platform integration. Rejected: two codebases means 2× the work for a solo founder. The polish gain isn't worth the multiplier.

- **PWA / web wrapper (like v1).** Rejected: v1 proved this works for validation but limits camera UX, push notifications, and overall "feels like an app" polish. We've outgrown it.

- **Capacitor + Ionic.** Web tech with native shell. Rejected: similar limitations to PWA, plus a less mature animation/gesture story than React Native + Reanimated.

## Consequences

### Good
- **EAS Build** removes the entire "set up Xcode, manage provisioning profiles, configure Gradle" burden — Expo handles it.
- **EAS Update** lets us ship JS-only fixes without re-submitting to the App Store / Play Store.
- Expo SDK is curated; modules are tested together and version-aligned. Way less "this RN module doesn't work with that one" pain.
- Expo Router (file-based routing) keeps screen organization sane as it grows.
- Active community, regular SDK releases, well-maintained.
- TypeScript types are excellent across the Expo modules.

### Bad / trade-offs accepted
- We're locked into what Expo supports. If we need a native module that doesn't exist in Expo, we'd need to use a config plugin or eject to bare. Mitigated by not needing exotic native features.
- EAS Build is a paid service (free tier exists for hobby use; the production builds we'll need on a regular cadence push us into a paid plan at some point — budget ~€20-50/month).
- Expo Push uses Expo's relay servers (in EU/US). For Knuteloop we should check whether the push payload contains any PII — it shouldn't (just "you have a new submission to review"), but worth verifying. If we need to be extra strict, we can self-host push via Firebase Cloud Messaging directly, but that's US-hosted and brings back the data residency concern.
- Expo's New Architecture is the default in SDK 56+. We commit to running with the New Architecture from day one (better perf, future-proof) and accept the rare third-party library compatibility issue.

### Neutral
- We should follow Expo's upgrade cadence (~quarterly SDK releases). Falling behind makes future upgrades harder.

## Open questions

- For Expo Push: confirm push payloads contain ZERO PII. The payload should reference user/submission IDs only; the client fetches details after receiving.
- At what scale do we need to consider self-hosted push? Probably never — Expo Push handles millions of devices for other apps with no issues.
