import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROFILE_KEY, createStore } from '../src/storage.js'
import { emptyProfile } from '../src/schema.js'

class Mem { constructor() { this.m = new Map() } get length() { return this.m.size } key(i) { return [...this.m.keys()][i] ?? null } getItem(k) { return this.m.has(k) ? this.m.get(k) : null } setItem(k, v) { this.m.set(k, String(v)) } removeItem(k) { this.m.delete(k) } }
const profile = () => { const p = emptyProfile(); p.contact.name = 'Alex'; p.contact.phone = '1'; return p }

test('personal mode saves, reads back and loads', () => {
  const s = new Mem(), store = createStore({ storage: s })
  assert.equal(store.save(profile()), true); assert.equal(store.load().contact.name, 'Alex')
})
test('assist mode (agency tablet) never writes anything', () => {
  const s = new Mem(), store = createStore({ storage: s, mode: 'assist' })
  assert.equal(store.save(profile()), false); store.setDontSave(false); assert.equal(s.length, 0); assert.equal(store.load(), null)
})
test("\"don't save\" removes the profile and stops future saves", () => {
  const s = new Mem(), store = createStore({ storage: s })
  store.save(profile()); store.setDontSave(true)
  assert.equal(s.getItem(PROFILE_KEY), null); assert.equal(store.save(profile()), false); assert.equal(store.persisting, false)
  store.setDontSave(false); assert.equal(store.persisting, true)
})
test('the clear ritual removes every TradeSheet key, keeps other sites\' keys, and verifies by reading back', () => {
  const s = new Mem(), store = createStore({ storage: s })
  store.save(profile()); store.setDontSave(true); s.setItem('other.app', 'keep')
  const r = store.clearAll()
  assert.deepEqual(r, { ok: true, remaining: [] }); assert.deepEqual([...s.m.keys()], ['other.app'])
})
test('a storage that refuses to delete is reported, never claimed as cleared', () => {
  const s = new Mem(); s.setItem('tradesheet.profile.v1', 'x'); s.removeItem = () => {}
  const r = createStore({ storage: s }).clearAll()
  assert.equal(r.ok, false); assert.deepEqual(r.remaining, ['tradesheet.profile.v1'])
})
test('a save that does not read back is not reported as saved', () => {
  const s = new Mem(); s.setItem = () => {}
  assert.equal(createStore({ storage: s }).save(profile()), false)
})
