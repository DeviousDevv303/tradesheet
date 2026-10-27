import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BULLETS, CERTS, GENERAL_BULLETS, TRADES, allBulletIds } from '../src/catalog.js'
import { STRINGS } from '../src/i18n.js'

test('every pick-list bullet, trade and cert carries both languages', () => {
  for (const item of [...TRADES, ...CERTS, ...Object.values(BULLETS).flat(), ...GENERAL_BULLETS]) {
    assert.ok(item.en?.trim(), `${item.id} en`); assert.ok(item.es?.trim(), `${item.id} es`)
  }
})
test('bullet ids are unique (profiles store bullets by id)', () => {
  const ids = allBulletIds(); assert.equal(new Set(ids).size, ids.length)
})
test('every trade offers at least four bullets', () => { for (const t of TRADES) assert.ok((BULLETS[t.id] ?? []).length >= 4, t.id) })
test('Spanish is actually translated, not copied', () => {
  const same = Object.values(BULLETS).flat().filter(b => b.en === b.es)
  assert.deepEqual(same, [])
})
test('every interface string exists in both languages', () => {
  assert.deepEqual(Object.keys(STRINGS.es).sort(), Object.keys(STRINGS.en).sort())
  for (const lang of ['en', 'es']) for (const [k, v] of Object.entries(STRINGS[lang])) assert.ok(v.trim(), `${lang}.${k}`)
})

import { readFileSync } from 'node:fs'
test('the privacy promise is enforced by the page CSP: no outbound connections, everything self-hosted', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const csp = /Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? ''
  for (const d of ["connect-src 'none'", "default-src 'self'", "script-src 'self'", "form-action 'none'", "object-src 'none'"]) assert.ok(csp.includes(d), d)
  assert.equal(/https?:\/\//.test(html.replace(/<!--[\s\S]*?-->/g, '')), false, 'no external URL anywhere in index.html')
})
