// Where a profile lives. Personal mode (the worker's own phone): saved in this browser unless the worker turns saving off.
// Assist mode (an agency tablet): NEVER written to storage; memory only, cleared by the ritual or by inactivity.
import { normalize } from './schema.js'

export const PREFIX = 'tradesheet.'
export const PROFILE_KEY = `${PREFIX}profile.v1`
export const PREFS_KEY = `${PREFIX}prefs.v1`

export function browserStorage() {
  try { const s = globalThis.localStorage; const k = `${PREFIX}probe`; s.setItem(k, '1'); s.removeItem(k); return s } catch { return null }
}

export function createStore({ storage = browserStorage(), mode = 'personal' } = {}) {
  const assist = mode === 'assist'
  const read = (k) => { try { return storage?.getItem(k) ?? null } catch { return null } }
  const prefs = () => { try { return JSON.parse(read(PREFS_KEY) || '{}') } catch { return {} } }
  const persisting = () => !assist && !!storage && prefs().dontSave !== true
  return {
    mode,
    get persisting() { return persisting() },
    load() {
      if (!persisting()) return null
      const raw = read(PROFILE_KEY)
      if (!raw) return null
      try { return normalize(JSON.parse(raw)) } catch { return null }
    },
    /** Returns true only when the write was read back intact. */
    save(profile) {
      if (!persisting()) return false
      const text = JSON.stringify(normalize(profile))
      try { storage.setItem(PROFILE_KEY, text); return storage.getItem(PROFILE_KEY) === text } catch { return false }
    },
    setDontSave(on) {
      if (assist || !storage) return
      try {
        if (on) { storage.removeItem(PROFILE_KEY); storage.setItem(PREFS_KEY, JSON.stringify({ dontSave: true })) } else storage.removeItem(PREFS_KEY)
      } catch { /* storage refused: nothing was saved either way */ }
    },
    /** The clear-my-data ritual: remove every TradeSheet key, then read back. `remaining` must be empty for the UI to say "removed". */
    clearAll() {
      const remaining = []
      for (const s of [storage, safe(() => globalThis.sessionStorage)]) {
        if (!s) continue
        try {
          for (const k of keysOf(s)) if (k.startsWith(PREFIX)) s.removeItem(k)
          for (const k of keysOf(s)) if (k.startsWith(PREFIX)) remaining.push(k)
        } catch { remaining.push('(storage not readable)') }
      }
      return { ok: remaining.length === 0, remaining }
    },
  }
}
const safe = f => { try { return f() } catch { return null } }
function keysOf(s) { const out = []; for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k !== null) out.push(k) } return out }
