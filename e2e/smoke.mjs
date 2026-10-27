// End-to-end check in a real Chromium on a phone-sized screen. Run: node e2e/smoke.mjs  (needs Playwright + Chromium and pdftotext)
// BASE=/tradesheet/ node e2e/smoke.mjs serves the app under a subpath, as GitHub Pages does for a project site.
// Asserts: the intake completes, the PDF downloads and parses, no request leaves the site, no CSP violation, no page error,
// assist mode writes nothing to storage, and the clear ritual leaves no TradeSheet keys behind.
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
// Playwright is resolved like a CommonJS package so a globally installed copy works too (CI installs it with npx playwright install).
const { chromium, devices } = createRequire(import.meta.url)('playwright')

const PORT = 8765
const root = new URL('..', import.meta.url).pathname
const BASE = process.env.BASE || '/'
if (!/^\/([a-z0-9-]+\/)?$/.test(BASE)) throw new Error(`BASE must be "/" or "/<name>/", got ${BASE}`)
// Under a subpath the server's root holds a link named after it, so only /<name>/... resolves to the app.
const serveDir = BASE === '/' ? root : (() => { const d = mkdtempSync(join(tmpdir(), 'ts-base-')); mkdirSync(join(d, '.keep')); symlinkSync(root, join(d, BASE.slice(1, -1)), 'dir'); return d })()
const APP = `http://127.0.0.1:${PORT}${BASE}`
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: serveDir, stdio: 'ignore' })
const fail = m => { console.error('E2E FAIL:', m); process.exitCode = 1 }
/** Tap like a person: scroll it into view, then require that the button itself is the topmost element at its centre
 *  (document.elementFromPoint), and only then click. Playwright's own covered-element heuristic misfires on sticky bars. */
async function tap(loc) {
  await loc.scrollIntoViewIfNeeded()
  const top = await loc.evaluate(el => { const r = el.getBoundingClientRect(); const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return el === at || el.contains(at) })
  if (!top) fail(`covered button: ${(await loc.textContent())?.trim()}`)
  await loc.click({ force: true })
  const page = loc.page()
  const junk = await page.evaluate(() => /\[object [A-Za-z]+\]|undefined|NaN|\bnull\b/.test(document.body.innerText))
  if (junk) fail(`rendering junk on screen after tapping "${(await loc.textContent().catch(() => ''))?.trim()}": ${(await page.evaluate(() => document.body.innerText)).match(/.{0,40}(\[object [A-Za-z]+\]|undefined|NaN|\bnull\b).{0,20}/)?.[0]}`)
}
await new Promise(r => setTimeout(r, 800))
const browser = await chromium.launch()
try {
  for (const lang of ['en', 'es']) {
    const ctx = await browser.newContext({ ...devices['Pixel 7'], acceptDownloads: true, locale: lang === 'es' ? 'es-MX' : 'en-US' })
    const page = await ctx.newPage()
    const offsite = [], errors = [], csp = []
    page.on('request', r => { if (!r.url().startsWith(`http://127.0.0.1:${PORT}/`) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) offsite.push(r.url()) })
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => console.error(`CSP ${e.violatedDirective} ${e.blockedURI}`)))
    await page.goto(APP)
    const S = lang === 'es' ? { start: 'Empezar', next: 'Siguiente', name: 'Nombre completo', phone: 'Teléfono', role: 'Puesto', employer: 'Empleador', city: 'Ciudad (opcional)', addJob: 'Agregar este trabajo', download: 'Descargar PDF', trade: 'Técnico de turbinas eólicas', cert: 'OSHA 30', bullet: 'Subí torres' }
      : { start: 'Start', next: 'Next', name: 'Full name', phone: 'Phone', role: 'Job title', employer: 'Employer', city: 'City (optional)', addJob: 'Add this job', download: 'Download PDF', trade: 'Wind turbine technician', cert: 'OSHA 30', bullet: 'Climbed towers' }
    await tap(page.getByRole('button', { name: S.start }))
    await page.getByLabel(S.name).fill('Prueba Ñandú Test')
    await page.getByLabel(S.phone).fill('555-0100')
    await tap(page.getByRole('button', { name: S.next }))
    await tap(page.getByRole('button', { name: S.trade }))
    await tap(page.getByRole('button', { name: S.next }))
    await tap(page.getByRole('button', { name: S.cert, exact: true }))
    await tap(page.getByRole('button', { name: S.next }))
    await page.getByLabel(S.role).fill('Wind Tech')
    await page.getByLabel(S.employer).fill('Mesa Wind')
    await tap(page.getByRole('button', { name: new RegExp(S.bullet) }))
    await tap(page.getByRole('button', { name: S.addJob }))
    // a draft with no title or employer must stop Next and say so, not vanish
    await page.getByLabel(S.city).fill('Abilene')
    await tap(page.getByRole('button', { name: S.next }))
    if (!(await page.getByTestId('job-error').isVisible())) fail(`${lang}: a half-typed job was dropped silently on Next`)
    // phone run 2026-10-27: a job typed but not "added" must not vanish when the worker taps Next
    await page.getByLabel(S.role).fill('Crane Operator')
    await page.getByLabel(S.employer).fill('Big Lift Co')
    for (let i = 0; i < 3; i++) await tap(page.getByRole('button', { name: S.next }))
    const timer = await page.getByTestId('timer').textContent()
    const [dl] = await Promise.all([page.waitForEvent('download'), tap(page.getByTestId('download'))])
    const dir = mkdtempSync(join(tmpdir(), 'ts-e2e-'))
    const pdfPath = join(dir, 'r.pdf'); await dl.saveAs(pdfPath)
    const text = execFileSync('pdftotext', [pdfPath, '-']).toString()
    const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPath]).toString())[1])
    if (!text.includes('Prueba Ñandú Test')) fail(`${lang}: name missing from PDF text`)
    if (!/WORK EXPERIENCE/.test(text)) fail(`${lang}: output must default to English headings (operator decision)`)
    if (!text.includes('Climbed towers')) fail(`${lang}: picked bullet missing in English output`)
    if (!text.includes('Crane Operator') || !text.includes('Big Lift Co')) fail(`${lang}: a typed job was dropped when Next was tapped without "add"`)
    if (!(await page.getByTestId('preview').innerText()).includes('WORK EXPERIENCE')) fail(`${lang}: WORK EXPERIENCE missing from the on-screen preview`)
    if (pages !== 1) fail(`${lang}: expected 1 page, got ${pages}`)
    const stored = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tradesheet.')))
    if (!stored.includes('tradesheet.profile.v1')) fail(`${lang}: personal mode should save the profile`)
    const blocked = await page.evaluate(() => fetch('https://example.com/collect', { method: 'POST', body: 'x' }).then(() => false, () => true))
    if (!blocked) fail(`${lang}: a fetch to another site was NOT blocked`)
    page.once('dialog', d => d.accept())
    await tap(page.getByTestId('clear'))
    const after = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tradesheet.')))
    if (after.length) fail(`${lang}: keys left after clear: ${after}`)
    if (!(await page.getByTestId('cleared').isVisible())) fail(`${lang}: no cleared confirmation`)
    if (offsite.length) fail(`${lang}: requests left the site: ${offsite}`)
    const real = errors.filter(e => !e.includes('example.com/collect')) // the probe's own, expected refusal
    if (real.length) fail(`${lang}: page errors: ${real.join(' | ')}`)
    console.log(`${lang}: intake done in ${timer} (scripted), pdf ${pages} page, offsite requests ${offsite.length}, errors ${errors.filter(e => !e.includes('example.com/collect')).length}, outbound fetch blocked ${blocked}, keys after clear ${after.length}`)
    writeFileSync(join(dir, 'text.txt'), text)
    await ctx.close()
  }
  // Assist mode: nothing is ever written; the QR shows only the app URL.
  const ctx = await browser.newContext({ ...devices['Galaxy Tab S4'] })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`${APP}?mode=assist`)
  const qrLabel = await page.locator('.qr').getAttribute('aria-label')
  if (qrLabel !== APP) fail(`assist: QR must carry only the app URL, got ${qrLabel}`)
  if (!(await page.locator('.qr svg').count())) fail('assist: QR did not render')
  await tap(page.getByRole('button', { name: 'Start' }))
  await page.getByLabel('Full name').fill('Tablet Walk-in')
  await page.getByLabel('Phone').fill('555-0101')
  await tap(page.getByRole('button', { name: 'Next' }))
  const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tradesheet.')))
  if (keys.length) fail(`assist: wrote to storage: ${keys}`)
  if (errors.length) fail(`assist: page errors: ${errors.join(' | ')}`)
  console.log(`assist: storage keys ${keys.length}, QR payload ${qrLabel}`)
  await ctx.close()
} finally {
  await browser.close(); server.kill()
}
