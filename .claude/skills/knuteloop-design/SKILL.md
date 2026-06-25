---
name: knuteloop-design
description: Use this skill to generate well-branded interfaces and assets for Knuteloop, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Quick orientation:
- Knuteloop digitizes the Norwegian *russ* tradition of **knuter** (challenges). Mobile-first iOS/Android app. All user-facing copy is **Bokmål**; never translate domain terms (russ, russenavn, knute, knutesjef, toppliste).
- The brand is a warm neo-brutalist **"sticker"** look: cream paper, royal-blue primary, golden-yellow accent, deep-navy ink. Headlines in **Bricolage Grotesque**, body in **Inter**, numerals in **JetBrains Mono**.
- The signature is the sticker treatment — 2px ink border + hard offset shadow that lifts on hover and presses flat on click (`.sticker` utility / `interactive` components).
- Russ-red + Norwegian navy belong to the **app icon / splash only**, not general UI.
- Tokens live in `styles.css` → `tokens/*`. Components mount from `window.KnuteloopDesignSystem_89dd9e`. Foundation specimens are in `guidelines/`; the full app recreation is in `ui_kits/knuteloop-app/`.
