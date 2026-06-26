import type { ChipTone, KnoteGlyph } from '../components/primitives'

// Shared mappings for rendering knuter in the sticker UI (admin + library).
// Keeps the difficulty→tone and folder→glyph vocabularies in one place.

export type Difficulty = 'Lett' | 'Medium' | 'Hard' | 'Valgfri'

export function difficultyTone(difficulty: Difficulty): ChipTone {
  switch (difficulty) {
    case 'Lett':
      return 'success'
    case 'Medium':
      return 'warning'
    case 'Hard':
      return 'danger'
    case 'Valgfri':
    default:
      return 'neutral'
  }
}

// Library `suggestedFolder` values (Generelle / Dobbel / Rampestrek / Alkohol /
// Sex) → the matching custom knot glyph. Unknown folders fall back to the brand
// knot. NB: these are the library folder names, not the legacy KnuteCategory enum.
const FOLDER_GLYPH: Record<string, KnoteGlyph> = {
  Generelle: 'generelle',
  Dobbel: 'dobbel',
  Rampestrek: 'fordervett',
  Alkohol: 'alkohol',
  Sex: 'sex',
}

export function folderGlyph(folder: string | null | undefined): KnoteGlyph {
  if (!folder) return 'knute'
  return FOLDER_GLYPH[folder] ?? 'knute'
}

// Folders that warrant the amber "sensitive" tint + a friction gate on import.
const SENSITIVE_FOLDERS = new Set(['Alkohol', 'Sex'])

export function isSensitiveFolder(folder: string | null | undefined): boolean {
  return folder != null && SENSITIVE_FOLDERS.has(folder)
}
