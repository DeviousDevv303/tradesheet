// The profile file format. Versioned from day one: it is the migration path to v2 (cert reminders will need it).
// A file from a NEWER TradeSheet is refused, never guessed at. Older files are migrated step by step.

export const FORMAT = 'tradesheet-profile'
export const SCHEMA_VERSION = 1
const LIMITS = { short: 80, line: 200, bullet: 240, jobs: 12, bullets: 8, certs: 20, refs: 4 }

/** version -> function(profile of that version) => profile of version+1. Empty until v2 exists. */
export const MIGRATIONS = {}

export class ProfileError extends Error {}

export function emptyProfile() {
  return {
    contact: { name: '', phone: '', email: '', city: '', state: '' },
    trades: [],
    otherTrade: '',
    certs: [],
    jobs: [],
    availability: { shifts: [], overtime: false, transport: false, travel: false, start: '' },
    references: [],
    outputLang: 'en',
  }
}

const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, max) : '')
const month = v => (typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : '')
const day = v => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '')
const arr = v => (Array.isArray(v) ? v : [])

/** Coerce anything into a well-formed v1 profile: unknown fields dropped, strings bounded, dates checked. */
export function normalize(p) {
  const e = emptyProfile()
  const src = p && typeof p === 'object' ? p : {}
  const c = src.contact ?? {}
  e.contact = { name: str(c.name, LIMITS.short), phone: str(c.phone, 30), email: str(c.email, LIMITS.short), city: str(c.city, 50), state: str(c.state, 20) }
  e.trades = [...new Set(arr(src.trades).filter(t => typeof t === 'string').map(t => str(t, 40)))].slice(0, 6)
  e.otherTrade = str(src.otherTrade, LIMITS.short)
  e.certs = arr(src.certs).slice(0, LIMITS.certs).map(x => ({ id: str(x?.id, 40), label: str(x?.label, LIMITS.short), number: str(x?.number, 40), expires: month(x?.expires) }))
    .filter(x => x.id && (x.id !== 'custom' || x.label))
  e.jobs = arr(src.jobs).slice(0, LIMITS.jobs).map(j => ({
    employer: str(j?.employer, LIMITS.short), agency: str(j?.agency, LIMITS.short), role: str(j?.role, LIMITS.short), city: str(j?.city, 50),
    start: month(j?.start), end: month(j?.end), current: j?.current === true,
    bullets: arr(j?.bullets).slice(0, LIMITS.bullets).map(b => (typeof b?.id === 'string' ? { id: str(b.id, 40) } : { text: str(b?.text, LIMITS.bullet), lang: b?.lang === 'es' ? 'es' : 'en' }))
      .filter(b => b.id || b.text),
  })).filter(j => j.employer || j.role)
  const a = src.availability ?? {}
  e.availability = { shifts: arr(a.shifts).filter(s => ['day', 'night', 'weekend', 'swing'].includes(s)), overtime: a.overtime === true, transport: a.transport === true, travel: a.travel === true, start: day(a.start) }
  e.references = arr(src.references).slice(0, LIMITS.refs).map(r => ({ name: str(r?.name, LIMITS.short), relation: str(r?.relation, LIMITS.short), phone: str(r?.phone, 30) })).filter(r => r.name)
  e.outputLang = src.outputLang === 'es' ? 'es' : 'en'
  return e
}

export function exportProfile(profile, now = new Date()) {
  return JSON.stringify({ format: FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), profile: normalize(profile) }, null, 2)
}

/** Read a profile file. Throws ProfileError with a reason the UI can show. */
export function importProfile(text) {
  let doc
  try { doc = JSON.parse(text) } catch { throw new ProfileError('not-json') }
  if (!doc || doc.format !== FORMAT) throw new ProfileError('not-tradesheet')
  const v = doc.schemaVersion
  if (!Number.isInteger(v) || v < 1) throw new ProfileError('bad-version')
  if (v > SCHEMA_VERSION) throw new ProfileError('newer-version')
  let profile = doc.profile
  for (let at = v; at < SCHEMA_VERSION; at++) {
    if (!MIGRATIONS[at]) throw new ProfileError('no-migration')
    profile = MIGRATIONS[at](profile)
  }
  return normalize(profile)
}
