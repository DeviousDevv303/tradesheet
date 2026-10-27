import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FORMAT, MIGRATIONS, ProfileError, SCHEMA_VERSION, emptyProfile, exportProfile, importProfile, normalize } from '../src/schema.js'

const fixture = readFileSync(new URL('./fixtures/sample-profile.json', import.meta.url), 'utf8')
const reason = fn => { try { fn(); return 'no error' } catch (e) { return e instanceof ProfileError ? e.message : `other: ${e.message}` } }

test('export -> import round-trips a profile exactly', () => {
  const p = importProfile(fixture)
  assert.deepEqual(importProfile(exportProfile(p)), p)
})
test('the file carries its format and schema version', () => {
  const doc = JSON.parse(exportProfile(emptyProfile(), new Date('2026-10-27T00:00:00Z')))
  assert.equal(doc.format, FORMAT); assert.equal(doc.schemaVersion, SCHEMA_VERSION); assert.equal(doc.exportedAt, '2026-10-27T00:00:00.000Z')
})
test('a file from a NEWER TradeSheet is refused, never guessed at', () => {
  assert.equal(reason(() => importProfile(JSON.stringify({ format: FORMAT, schemaVersion: SCHEMA_VERSION + 1, profile: {} }))), 'newer-version')
})
test('other files are refused with a reason', () => {
  assert.equal(reason(() => importProfile('not json')), 'not-json')
  assert.equal(reason(() => importProfile(JSON.stringify({ format: 'x', schemaVersion: 1 }))), 'not-tradesheet')
  assert.equal(reason(() => importProfile(JSON.stringify({ format: FORMAT, schemaVersion: 0 }))), 'bad-version')
})
test('every version below the current one has a migration (guards the v2 bump)', () => {
  for (let v = 1; v < SCHEMA_VERSION; v++) assert.equal(typeof MIGRATIONS[v], 'function', `missing migration ${v} -> ${v + 1}`)
})
test('normalize drops unknown fields, bounds text, and rejects malformed dates', () => {
  const p = normalize({ contact: { name: 'x'.repeat(500), evil: 1 }, certs: [{ id: 'twic', expires: '2026-13' }, { id: 'custom', label: '' }], jobs: [{ role: 'R', start: 'June', bullets: [{ id: 'wd-maint' }, { text: 'mine', lang: 'xx' }, {}] }], outputLang: 'fr', extra: true })
  assert.equal(p.contact.name.length, 80); assert.equal('evil' in p.contact, false); assert.equal('extra' in p, false)
  assert.deepEqual(p.certs, [{ id: 'twic', label: '', number: '', expires: '' }])
  assert.equal(p.jobs[0].start, ''); assert.deepEqual(p.jobs[0].bullets, [{ id: 'wd-maint' }, { text: 'mine', lang: 'en' }])
  assert.equal(p.outputLang, 'en')
})
test('the output language defaults to English (operator decision)', () => { assert.equal(emptyProfile().outputLang, 'en') })
