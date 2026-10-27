import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { importProfile } from '../src/schema.js'
import { buildResume } from '../src/resume.js'
import { certStatus, formatMonth } from '../src/dates.js'

const p = importProfile(readFileSync(new URL('./fixtures/sample-profile.json', import.meta.url), 'utf8'))
const TODAY = new Date('2026-10-27T12:00:00Z')

test('certifications come first, valid ones before expired, and an expired card is labelled expired', () => {
  const r = buildResume(p, 'en', TODAY)
  assert.equal(r.sections[0].heading, 'Certifications & Licenses')
  assert.deepEqual(r.sections[0].lines, ['OSHA 30', 'GWO Basic Safety Training — expires May 2027', 'TWIC card — expires Nov 2026', 'Forklift operator certification — expired Jan 2025'])
  assert.deepEqual(r.notes.expired, ['Forklift operator certification']); assert.deepEqual(r.notes.soon, ['TWIC card'])
})
test('jobs are newest first, the current one says Present, and an agency is shown as "via"', () => {
  const jobs = buildResume(p, 'en', TODAY).sections.find(s => s.jobs).jobs
  assert.deepEqual(jobs.map(j => j.title.split(' — ')[0]), ['Wind Turbine Technician', 'Forklift Operator', 'Electrician Helper'])
  assert.equal(jobs[0].meta, 'Sweetwater, TX · Mar 2024 – Present'); assert.match(jobs[0].title, /\(via Prairie Labor Staffing\)/)
})
test('pick-list bullets switch language; a typed line stays as typed and is flagged', () => {
  const en = buildResume(p, 'en', TODAY), es = buildResume(p, 'es', TODAY)
  const enJob = en.sections.find(s => s.jobs).jobs[1], esJob = es.sections.find(s => s.jobs).jobs[1]
  assert.equal(enJob.bullets[0], 'Operated forklift, reach truck and pallet jack safely')
  assert.equal(esJob.bullets[0], 'Operé montacargas, reach truck y patín hidráulico de forma segura')
  assert.equal(enJob.bullets[2], 'Entrené a tres compañeros en el uso del escáner'); assert.equal(en.notes.mixedLanguage, true); assert.equal(es.notes.mixedLanguage, false)
  assert.equal(es.sections[0].heading, 'Certificaciones y licencias')
})
test('dates', () => {
  assert.equal(formatMonth('2027-03', 'en'), 'Mar 2027'); assert.equal(formatMonth('2027-03', 'es'), 'mar 2027'); assert.equal(formatMonth('bad', 'en'), '')
  assert.equal(certStatus('2026-10', TODAY), 'soon'); assert.equal(certStatus('2026-09', TODAY), 'expired'); assert.equal(certStatus('2028-01', TODAY), 'valid'); assert.equal(certStatus('', TODAY), 'none')
  assert.equal(certStatus('2026-10', new Date('2026-11-01T00:00:00Z')), 'expired') // valid through the end of the month it expires
})

test('an expired card is listed after the valid ones even when it was entered first', () => {
  const q = { ...p, certs: [{ id: 'forklift', label: '', number: '', expires: '2025-01' }, { id: 'osha30', label: '', number: '', expires: '' }] }
  assert.deepEqual(buildResume(q, 'en', TODAY).sections[0].lines, ['OSHA 30', 'Forklift operator certification — expired Jan 2025'])
})
