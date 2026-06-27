import { isSensitiveKnute, isSensitiveFolder } from './knute-ui'

describe('isSensitiveKnute', () => {
  const base = { suggestedFolder: 'Generelle', minAge: 17, evidenceType: 'media' as const }

  it('flags sensitive folders', () => {
    expect(isSensitiveKnute({ ...base, suggestedFolder: 'Sex' })).toBe(true)
    expect(isSensitiveKnute({ ...base, suggestedFolder: 'Alkohol' })).toBe(true)
  })

  it('flags adult (18+) knuter regardless of folder', () => {
    expect(isSensitiveKnute({ ...base, minAge: 18 })).toBe(true)
  })

  it('flags text-evidence knuter regardless of folder (e.g. Rampestrek lapdances)', () => {
    expect(isSensitiveKnute({ ...base, suggestedFolder: 'Rampestrek', evidenceType: 'text' })).toBe(true)
  })

  it('does not flag an ordinary all-ages photo knute', () => {
    expect(isSensitiveKnute(base)).toBe(false)
    expect(isSensitiveKnute({ ...base, suggestedFolder: 'Dobbel' })).toBe(false)
  })
})

describe('isSensitiveFolder', () => {
  it('only treats Alkohol and Sex as sensitive folders', () => {
    expect(isSensitiveFolder('Sex')).toBe(true)
    expect(isSensitiveFolder('Alkohol')).toBe(true)
    expect(isSensitiveFolder('Rampestrek')).toBe(false)
    expect(isSensitiveFolder(null)).toBe(false)
  })
})
