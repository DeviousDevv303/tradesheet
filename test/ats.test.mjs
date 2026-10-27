// The acceptance gate the operator asked for: the generated PDF must parse like an ATS reads it. An independent parser (poppler's
// pdftotext/pdfinfo/pdffonts/pdfimages) reads the bytes; nothing here trusts our own renderer's idea of what it wrote.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { importProfile, normalize } from '../src/schema.js'
import { buildResume } from '../src/resume.js'
import { renderPdf } from '../src/pdf.js'

const p = importProfile(readFileSync(new URL('./fixtures/sample-profile.json', import.meta.url), 'utf8'))
const TODAY = new Date('2026-10-27T12:00:00Z')
const dir = mkdtempSync(join(tmpdir(), 'ts-ats-'))
const poppler = (bin, args) => execFileSync(bin, args).toString()
async function make(profile, lang, name) {
  const model = buildResume(profile, lang, TODAY)
  const out = await renderPdf(model, { date: TODAY })
  const file = join(dir, `${name}.pdf`); writeFileSync(file, out.bytes)
  return { model, out, file, text: poppler('pdftotext', [file, '-']), layout: poppler('pdftotext', ['-layout', file, '-']) }
}

for (const lang of ['en', 'es']) {
  test(`${lang}: one page, real text, standard fonts, no images`, async () => {
    const r = await make(p, lang, `sample-${lang}`)
    assert.match(poppler('pdfinfo', [r.file]), /Pages:\s+1\n/)
    const fonts = poppler('pdffonts', [r.file]).split('\n').slice(2).filter(Boolean)
    assert.ok(fonts.length >= 1 && fonts.every(f => /^Helvetica(-Bold)?\s+Type 1\s+WinAnsi/.test(f)), fonts.join('\n'))
    assert.deepEqual(poppler('pdfimages', ['-list', r.file]).split('\n').slice(2).filter(Boolean), [])
  })
  test(`${lang}: every line of the resume is extracted, in reading order, with accents intact`, async () => {
    const r = await make(p, lang, `order-${lang}`)
    const extracted = r.text.split('\n').map(s => s.trim()).filter(Boolean)
    const expected = [r.model.name, r.model.contact, ...r.model.sections.flatMap(s => [s.heading.toUpperCase(), ...(s.lines ?? []), ...(s.jobs ?? []).flatMap(j => [j.title, j.meta, ...j.bullets.map(b => `• ${b}`)])])].filter(Boolean)
    let at = 0
    for (const line of expected) {
      const i = extracted.indexOf(line, at)
      assert.ok(i >= 0, `missing or out of order: ${JSON.stringify(line)}`)
      at = i + 1
    }
    assert.ok(r.text.includes('Núñez') && r.text.includes('López'))
  })
  test(`${lang}: single column (no side-by-side text in the layout view)`, async () => {
    const r = await make(p, lang, `col-${lang}`)
    const gaps = r.layout.split('\n').filter(l => /\S {6,}\S/.test(l.trim()))
    assert.deepEqual(gaps, [])
  })
}

test('standard section headings an ATS looks for (English)', async () => {
  const r = await make(p, 'en', 'headings')
  for (const h of ['CERTIFICATIONS & LICENSES', 'WORK EXPERIENCE', 'AVAILABILITY', 'REFERENCES']) assert.ok(r.text.includes(h), h)
})
test('a very long profile is never cut off: it shrinks to the smallest size, then adds pages, and says so', async () => {
  const big = normalize({ ...p, jobs: Array.from({ length: 12 }, (_, i) => ({ ...p.jobs[0], role: `Role ${i}`, start: `20${10 + i}-01`, bullets: [...p.jobs[0].bullets, { id: 'gn-team' }, { id: 'gn-safety' }, { id: 'gn-reliable' }, { id: 'gn-train' }] })) })
  const r = await make(big, 'en', 'big')
  assert.ok(r.out.pages >= 2, `pages ${r.out.pages}`); assert.equal(r.out.bodySize, 9)
  assert.match(poppler('pdfinfo', [r.file]), new RegExp(`Pages:\\s+${r.out.pages}\\n`))
  for (let i = 0; i < 12; i++) assert.ok(r.text.includes(`Role ${i}`), `Role ${i} lost`)
})
test('characters the standard font cannot encode are replaced, not fatal', async () => {
  const odd = normalize({ ...p, contact: { ...p.contact, name: 'Alex 🔧 Rivera 李' } })
  const r = await make(odd, 'en', 'odd')
  assert.match(r.text, /Alex \?+ Rivera \?/)
})
test('the same profile on the same date gives the same text', async () => {
  const a = await make(p, 'en', 'det-a'), b = await make(p, 'en', 'det-b')
  assert.equal(a.text, b.text)
})
