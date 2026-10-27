// TradeSheet UI: a phone-first guided intake. Everything runs in this page; nothing is sent anywhere (see the CSP in index.html).
import { CERTS, TRADES, bulletById, bulletsForTrades, certById } from './catalog.js'
import { certStatus } from './dates.js'
import { STRINGS, t as tr, uiLangFrom } from './i18n.js'
import { renderPdf } from './pdf.js'
import { handoffUrl, qrSvg } from './qr.js'
import { buildResume } from './resume.js'
import { ProfileError, emptyProfile, exportProfile, importProfile } from './schema.js'
import { createStore } from './storage.js'

const params = new URLSearchParams(location.search)
const mode = params.get('mode') === 'assist' ? 'assist' : 'personal'
const store = createStore({ mode })
const ASSIST_IDLE_MS = 10 * 60 * 1000
const MAX_PICKED = 4
const STEPS = ['welcome', 'contact', 'trades', 'certs', 'jobs', 'avail', 'refs', 'review']

const state = {
  lang: params.get('lang') === 'es' || params.get('lang') === 'en' ? params.get('lang') : uiLangFrom(navigator.languages ?? [navigator.language]),
  step: 0,
  profile: store.load() ?? emptyProfile(),
  draft: newDraft(),
  startedAt: 0,
  finishedMs: 0,
  message: '',
  pdf: null,
}
function newDraft() { return { employer: '', agency: '', role: '', city: '', start: '', end: '', current: false, bullets: [], own: '' } }

const app = document.getElementById('app')
const T = key => tr(state.lang, key)
const save = () => { store.save(state.profile) }
document.documentElement.lang = state.lang

// ─── tiny DOM helper ─────────────────────────────────────────────────────────────────────────────────────────────────
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else if (k === 'text') el.textContent = v
    else if (k === 'value') el.value = v
    else if (k === 'checked') el.checked = v
    else if (k === 'style') el.style.cssText = v // CSSOM, not a style attribute: allowed by the page's CSP
    else el.setAttribute(k, v === true ? '' : v)
  }
  for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)))
  return el
}
const field = (label, value, onInput, type = 'text', extra = {}) => {
  const id = `f-${Math.random().toString(36).slice(2, 8)}`
  return [h('label', { for: id, text: label }), h('input', { id, type, value, autocomplete: extra.autocomplete ?? 'off', inputmode: extra.inputmode, oninput: e => onInput(e.target.value) })]
}
const chip = (label, on, onClick, cls = 'chip') => h('button', { type: 'button', class: cls, 'aria-pressed': on ? 'true' : 'false', onclick: onClick, text: label })
const toggle = (label, on, onChange) => h('label', {}, h('input', { type: 'checkbox', checked: on, onchange: e => onChange(e.target.checked) }), ' ', label)

function go(step) { state.step = Math.max(0, Math.min(STEPS.length - 1, step)); state.message = ''; if (STEPS[state.step] === 'review' && !state.finishedMs && state.startedAt) state.finishedMs = Date.now() - state.startedAt; render(); window.scrollTo(0, 0) }
/** beforeNext() may return false to stay on the step (it must then say why on screen). */
function nav(canNext = true, beforeNext = () => true) {
  return h('div', { class: 'nav' }, h('div', { class: 'row' },
    h('button', { type: 'button', class: 'secondary', onclick: () => go(state.step - 1), text: T('back') }),
    state.step < STEPS.length - 1 ? h('button', { type: 'button', class: 'primary', disabled: !canNext, onclick: () => { if (beforeNext() === false) return; save(); go(state.step + 1) }, text: T('next') }) : null))
}
/** The job being typed, if any. Adding it is what "Add this job" does; Next does it too, so a typed job is never lost. */
const draftHasContent = d => [d.role, d.employer, d.agency, d.city, d.start, d.end, d.own].some(v => (v || '').trim()) || d.bullets.length > 0
function addDraftJob() {
  const p = state.profile, d = state.draft
  if (!d.role.trim() && !d.employer.trim()) return false
  const bullets = [...d.bullets.map(id => ({ id })), ...(d.own.trim() ? [{ text: d.own.trim(), lang: state.lang }] : [])]
  p.jobs.push({ employer: d.employer.trim(), agency: d.agency.trim(), role: d.role.trim(), city: d.city.trim(), start: d.start, end: d.current ? '' : d.end, current: d.current, bullets })
  state.draft = newDraft(); save()
  return true
}
function progress() { return h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': STEPS.length - 1, 'aria-valuenow': state.step }, h('div', { style: `width:${(state.step / (STEPS.length - 1)) * 100}%` })) }
function topbar() {
  return h('div', { class: 'topbar' }, h('strong', { text: T('appTitle') }),
    h('button', { type: 'button', class: 'linkbtn', onclick: () => { state.lang = state.lang === 'es' ? 'en' : 'es'; document.documentElement.lang = state.lang; render() }, text: T('language') }))
}

// ─── steps ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const views = {
  welcome() {
    const kids = [h('h1', { text: T('appTitle') }), h('p', { text: T('tagline') }), h('p', { class: 'note', text: T('privacy') })]
    if (mode === 'assist') {
      const url = handoffUrl(location)
      const box = h('div', { class: 'qr', role: 'img', 'aria-label': url })
      box.innerHTML = qrSvg(url) // qrcode-generator builds a self-contained SVG from the URL only
      kids.unshift(h('div', { class: 'banner', text: T('assistBanner') }))
      kids.push(h('div', { class: 'card' }, h('strong', { text: T('handoff') }), box, h('p', { class: 'note', text: T('handoffNote') }), h('p', { class: 'note', text: url })))
    }
    kids.push(h('button', { type: 'button', class: 'primary', onclick: () => { state.startedAt = Date.now(); state.finishedMs = 0; go(1) }, text: T('start') }))
    kids.push(loadFileButton())
    return kids
  },
  contact() {
    const c = state.profile.contact
    const set = k => v => { c[k] = v; save(); refreshNext() }
    return [h('h2', { text: T('stepContact') }),
      field(T('name'), c.name, set('name'), 'text', { autocomplete: 'name' }), field(T('phone'), c.phone, set('phone'), 'tel', { autocomplete: 'tel', inputmode: 'tel' }),
      field(T('email'), c.email, set('email'), 'email', { autocomplete: 'email' }),
      h('div', { class: 'row' }, h('div', {}, field(T('city'), c.city, set('city'), 'text', { autocomplete: 'address-level2' })), h('div', {}, field(T('state'), c.state, set('state'), 'text', { autocomplete: 'address-level1' }))),
      nav(!!(c.name.trim() && c.phone.trim()))]
  },
  trades() {
    const p = state.profile
    return [h('h2', { text: T('stepTrades') }),
      h('div', { class: 'chips' }, TRADES.map(tr_ => chip(tr_[state.lang], p.trades.includes(tr_.id), () => { p.trades = p.trades.includes(tr_.id) ? p.trades.filter(x => x !== tr_.id) : [...p.trades, tr_.id]; save(); render() }))),
      field(T('otherTrade'), p.otherTrade, v => { p.otherTrade = v; save() }), nav()]
  },
  certs() {
    const p = state.profile
    const has = id => p.certs.find(c => c.id === id)
    const list = CERTS.map(c => {
      const own = has(c.id)
      const status = own ? certStatus(own.expires) : 'none'
      return h('div', { class: 'card' },
        chip(c[state.lang], !!own, () => { p.certs = own ? p.certs.filter(x => x !== own) : [...p.certs, { id: c.id, label: '', number: '', expires: '' }]; save(); render() }),
        status === 'expired' ? h('span', { class: 'badge bad', text: T('expired') }) : status === 'soon' ? h('span', { class: 'badge warn', text: T('expiresSoon') }) : null,
        own ? [c.expires ? field(T('certExpires'), own.expires, v => { own.expires = v; save() }, 'month') : null, field(T('certNumber'), own.number, v => { own.number = v; save() })] : null)
    })
    const custom = p.certs.filter(c => c.id === 'custom')
    return [h('h2', { text: T('stepCerts') }), list,
      custom.map(c => h('div', { class: 'card' }, field(T('customCert'), c.label, v => { c.label = v; save() }), field(T('certExpires'), c.expires, v => { c.expires = v; save() }, 'month'),
        h('button', { type: 'button', class: 'danger', onclick: () => { p.certs = p.certs.filter(x => x !== c); save(); render() }, text: T('remove') }))),
      h('button', { type: 'button', class: 'secondary', onclick: () => { p.certs.push({ id: 'custom', label: '', number: '', expires: '' }); render() }, text: `${T('add')}: ${T('customCert')}` }), nav()]
  },
  jobs() {
    const p = state.profile, d = state.draft
    const setD = k => v => { d[k] = v }
    const offered = bulletsForTrades(p.trades)
    const added = p.jobs.map((j, i) => h('div', { class: 'card' }, h('strong', { text: [j.role, j.employer].filter(Boolean).join(' — ') }),
      h('div', { class: 'note', text: `${j.start || ''} – ${j.current ? T('present') : j.end || ''}` }),
      h('button', { type: 'button', class: 'danger', onclick: () => { p.jobs.splice(i, 1); save(); render() }, text: T('remove') })))
    return [h('h2', { text: T('stepJobs') }), p.jobs.length ? h('p', { class: 'note', text: `${T('jobsAdded')}: ${p.jobs.length}` }) : null, added,
      h('div', { class: 'card' },
        field(T('role'), d.role, setD('role')), field(T('employer'), d.employer, setD('employer')), field(T('agency'), d.agency, setD('agency')), field(T('jobCity'), d.city, setD('city')),
        h('div', { class: 'row' }, h('div', {}, field(T('startMonth'), d.start, setD('start'), 'month')), d.current ? null : h('div', {}, field(T('endMonth'), d.end, setD('end'), 'month'))),
        toggle(T('currentJob'), d.current, on => { d.current = on; render() }),
        h('label', { text: T('pickBullets') }),
        h('div', { class: 'chips' }, offered.map(b => chip(b[state.lang], d.bullets.includes(b.id), () => {
          d.bullets = d.bullets.includes(b.id) ? d.bullets.filter(x => x !== b.id) : d.bullets.length < MAX_PICKED ? [...d.bullets, b.id] : d.bullets; render()
        }, 'chip bullet'))),
        field(T('ownBullet'), d.own, setD('own')),
        state.jobError ? h('div', { class: 'alert', 'data-testid': 'job-error', text: T('jobNeedsTitle') }) : null,
        h('button', { type: 'button', class: 'primary', onclick: () => { state.jobError = !addDraftJob(); render() }, text: T('addJob') })),
      // Next keeps a typed job (adds it) and never drops one silently: a draft with no title or employer stops here and says why.
      nav(true, () => {
        if (!draftHasContent(state.draft)) { state.jobError = false; return true }
        if (addDraftJob()) { state.jobError = false; return true }
        state.jobError = true; render(); return false
      })]
  },
  avail() {
    const a = state.profile.availability
    const shifts = [['day', 'shiftDay'], ['night', 'shiftNight'], ['swing', 'shiftSwing'], ['weekend', 'shiftWeekend']]
    return [h('h2', { text: T('stepAvail') }),
      h('div', { class: 'chips' }, shifts.map(([id, key]) => chip(T(key), a.shifts.includes(id), () => { a.shifts = a.shifts.includes(id) ? a.shifts.filter(x => x !== id) : [...a.shifts, id]; save(); render() }))),
      toggle(T('overtime'), a.overtime, v => { a.overtime = v; save() }), toggle(T('transport'), a.transport, v => { a.transport = v; save() }), toggle(T('travel'), a.travel, v => { a.travel = v; save() }),
      field(T('startDate'), a.start, v => { a.start = v; save() }, 'date'), nav()]
  },
  refs() {
    const p = state.profile
    return [h('h2', { text: T('stepRefs') }),
      p.references.map((r, i) => h('div', { class: 'card' }, field(T('refName'), r.name, v => { r.name = v; save() }), field(T('refRelation'), r.relation, v => { r.relation = v; save() }),
        field(T('refPhone'), r.phone, v => { r.phone = v; save() }, 'tel', { inputmode: 'tel' }), h('button', { type: 'button', class: 'danger', onclick: () => { p.references.splice(i, 1); save(); render() }, text: T('remove') }))),
      p.references.length < 4 ? h('button', { type: 'button', class: 'secondary', onclick: () => { p.references.push({ name: '', relation: '', phone: '' }); render() }, text: T('addRef') }) : null, nav()]
  },
  review() {
    const p = state.profile
    const model = buildResume(p, p.outputLang)
    const warn = []
    if (model.notes.expired.length) warn.push(h('div', { class: 'alert', text: `${T('expired')}: ${model.notes.expired.join(', ')}` }))
    if (model.notes.soon.length) warn.push(h('div', { class: 'banner', text: `${T('expiresSoon')}: ${model.notes.soon.join(', ')}` }))
    if (model.notes.mixedLanguage) warn.push(h('p', { class: 'note', text: T('ownTextNote') }))
    if (state.pdf?.pages > 1) warn.push(h('div', { class: 'alert', text: T('twoPages') }))
    const mins = Math.floor(state.finishedMs / 60000), secs = Math.floor((state.finishedMs % 60000) / 1000)
    return [h('h2', { text: T('stepReview') }),
      state.finishedMs ? h('p', {}, `${T('finishedIn')} `, h('span', { class: 'timer', 'data-testid': 'timer', text: `${mins}:${String(secs).padStart(2, '0')}` })) : null,
      h('label', { text: T('outputLang') }),
      h('div', { class: 'chips' }, chip(T('outEn'), p.outputLang === 'en', () => { p.outputLang = 'en'; state.pdf = null; save(); render() }), chip(T('outEs'), p.outputLang === 'es', () => { p.outputLang = 'es'; state.pdf = null; save(); render() })),
      warn, preview(model),
      h('button', { type: 'button', class: 'primary', 'data-testid': 'download', onclick: () => downloadPdf(model), text: T('download') }),
      navigator.canShare ? h('button', { type: 'button', class: 'secondary', onclick: () => sharePdf(model), text: T('share') }) : null,
      h('hr'),
      h('button', { type: 'button', class: 'secondary', onclick: saveFile, text: T('saveFile') }), loadFileButton(),
      mode === 'personal' ? [toggle(T('dontSave'), !store.persisting, on => { store.setDontSave(on); if (!on) save(); render() }), h('p', { class: 'note', text: T('saveHelp') })] : null,
      h('button', { type: 'button', class: 'danger', 'data-testid': 'clear', onclick: clearRitual, text: T('clear') }),
      state.message ? h('p', { class: 'note', 'data-testid': 'message', text: state.message }) : null,
      nav()]
  },
}

function preview(m) {
  return h('div', { class: 'preview', 'data-testid': 'preview' }, h('h3', { text: m.name }), h('div', { class: 'meta', text: m.contact }),
    m.sections.map(s => [h('h4', { text: s.heading.toUpperCase() }), (s.lines ?? []).map(l => h('div', { text: l })),
      (s.jobs ?? []).map(j => [h('strong', { text: j.title }), h('div', { class: 'meta', text: j.meta }), h('ul', {}, j.bullets.map(b => h('li', { text: b })))])]))
}

// ─── files ───────────────────────────────────────────────────────────────────────────────────────────────────────────
function fileName(ext) { return `${(state.profile.contact.name || 'resume').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume'}-${state.profile.outputLang}.${ext}` }
function deliver(blob, name) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name })
  document.body.append(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 30_000)
}
async function makePdf(model) {
  state.pdf = await renderPdf(model)
  return new Blob([state.pdf.bytes], { type: 'application/pdf' })
}
async function downloadPdf(model) { const blob = await makePdf(model); deliver(blob, fileName('pdf')); render() }
async function sharePdf(model) {
  const blob = await makePdf(model)
  const file = new File([blob], fileName('pdf'), { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }) } catch { /* the worker closed the share sheet */ } } else deliver(blob, fileName('pdf'))
  render()
}
function saveFile() { deliver(new Blob([exportProfile(state.profile)], { type: 'application/json' }), fileName('tradesheet.json')) }
function loadFileButton() {
  const input = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden', onchange: async e => {
    const f = e.target.files?.[0]; if (!f) return
    try { state.profile = importProfile(await f.text()); save(); state.message = ''; if (state.step === 0) { state.startedAt = Date.now(); go(STEPS.length - 1) } else render() } catch (err) { state.message = err instanceof ProfileError && err.message === 'newer-version' ? T('importNewer') : T('importError'); render() }
  } })
  return [input, h('button', { type: 'button', class: 'secondary', onclick: () => input.click(), text: T('loadFile') })]
}

// ─── the clear-my-data ritual ─────────────────────────────────────────────────────────────────────────────────────────
function clearRitual() {
  if (!confirm(T('clearConfirm'))) return
  wipe()
}
function wipe() {
  const result = store.clearAll()
  state.profile = emptyProfile(); state.draft = newDraft(); state.pdf = null; state.startedAt = 0; state.finishedMs = 0
  state.step = 0
  render()
  app.prepend(h('div', { class: result.ok ? 'banner' : 'alert', 'data-testid': 'cleared', text: result.ok ? T('cleared') : `${T('importError')} (${result.remaining.join(', ')})` }))
}
if (mode === 'assist') {
  let idle
  const arm = () => { clearTimeout(idle); idle = setTimeout(() => { if (state.step > 0 || state.profile.contact.name) wipe() }, ASSIST_IDLE_MS) }
  for (const ev of ['pointerdown', 'keydown', 'input']) document.addEventListener(ev, arm, { passive: true })
  arm()
}

// ─── render ──────────────────────────────────────────────────────────────────────────────────────────────────────────
function refreshNext() {
  const btn = app.querySelector('.nav .primary')
  const c = state.profile.contact
  if (btn && STEPS[state.step] === 'contact') btn.disabled = !(c.name.trim() && c.phone.trim())
}
function render() {
  // replaceChildren() turns null/undefined/false into the TEXT "null"/"undefined"/"false" (phone run 2026-10-27: "null" under the
  // Download button where navigator.canShare is missing). Views use `cond ? el : null`, so empty slots are dropped here, once.
  const kids = [topbar(), state.step > 0 ? progress() : null, views[STEPS[state.step]]()].flat(Infinity)
  app.replaceChildren(...kids.filter(k => k !== null && k !== undefined && k !== false && k !== ''))
}
render()
export const __debug = { state, STRINGS, bulletById, certById }
