// Profile -> resume content in one output language. Pure and layout-free, so the PDF and the on-screen preview say the same thing.
import { bulletById, certById, tradeById } from './catalog.js'
import { certStatus, formatMonth } from './dates.js'
import { t } from './i18n.js'

const byRecency = (a, b) => (b.current - a.current) || (b.end || b.start || '').localeCompare(a.end || a.start || '') || (b.start || '').localeCompare(a.start || '')

/**
 * @returns {{ name: string, contact: string, sections: Array<{ heading: string, lines?: string[], jobs?: Array<{ title: string, meta: string, bullets: string[] }> }>,
 *             notes: { expired: string[], soon: string[], mixedLanguage: boolean } }}
 */
export function buildResume(p, lang = p.outputLang, today = new Date()) {
  const L = lang === 'es' ? 'es' : 'en'
  const sections = []
  const notes = { expired: [], soon: [], mixedLanguage: false }

  const certLines = p.certs.map(c => {
    const base = c.id === 'custom' ? c.label : (certById(c.id)?.[L] ?? c.label ?? c.id)
    const label = c.number ? `${base} #${c.number}` : base
    const status = certStatus(c.expires, today)
    if (status === 'expired') notes.expired.push(base)
    if (status === 'soon') notes.soon.push(base)
    const when = formatMonth(c.expires, L)
    return { status, text: !when ? label : `${label} — ${status === 'expired' ? t(L, 'expiredWord') : t(L, 'expiresWord')} ${when}` }
  })
  // Valid cards first, expired ones last and labelled as expired: an agency checks these dates first, so they are never hidden or dressed up.
  const ordered = [...certLines.filter(c => c.status !== 'expired'), ...certLines.filter(c => c.status === 'expired')]
  if (ordered.length) sections.push({ heading: t(L, 'hCerts'), lines: ordered.map(c => c.text) })

  const trades = [...p.trades.map(id => tradeById(id)?.[L]).filter(Boolean), ...(p.otherTrade ? [p.otherTrade] : [])]
  if (trades.length) sections.push({ heading: t(L, 'hTrades'), lines: [trades.join(' · ')] })

  const jobs = [...p.jobs].sort(byRecency).map(j => {
    const where = j.agency ? `${j.employer} (${t(L, 'via')} ${j.agency})` : j.employer
    const span = [formatMonth(j.start, L), j.current ? t(L, 'present') : formatMonth(j.end, L)].filter(Boolean).join(' – ')
    const bullets = j.bullets.map(b => {
      if (b.id) return bulletById(b.id)?.[L]
      if (b.lang !== L) notes.mixedLanguage = true
      return b.text
    }).filter(Boolean)
    return { title: [j.role, where].filter(Boolean).join(' — '), meta: [j.city, span].filter(Boolean).join(' · '), bullets }
  })
  if (jobs.length) sections.push({ heading: t(L, 'hExperience'), jobs })

  const a = p.availability
  const shiftName = { day: 'shiftDay', night: 'shiftNight', swing: 'shiftSwing', weekend: 'shiftWeekend' }
  const avail = [
    a.shifts.length ? `${t(L, 'availShifts')}: ${a.shifts.map(s => t(L, shiftName[s])).join(', ')}` : '',
    a.overtime ? t(L, 'availOvertime') : '', a.transport ? t(L, 'availTransport') : '', a.travel ? t(L, 'availTravel') : '',
    a.start ? `${t(L, 'availStart')} ${a.start}` : '',
  ].filter(Boolean)
  if (avail.length) sections.push({ heading: t(L, 'hAvail'), lines: [avail.join(' · ')] })

  if (p.references.length) sections.push({ heading: t(L, 'hRefs'), lines: p.references.map(r => [r.name, r.relation, r.phone].filter(Boolean).join(' — ')) })

  const c = p.contact
  const place = [c.city, c.state].filter(Boolean).join(', ')
  return { name: c.name, contact: [place, c.phone, c.email].filter(Boolean).join(' · '), sections, notes }
}
