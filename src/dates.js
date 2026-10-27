const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
}
/** "2027-03" -> "Mar 2027" / "mar 2027". Empty for anything else. */
export function formatMonth(ym, lang) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '')
  return m ? `${MONTHS[lang === 'es' ? 'es' : 'en'][Number(m[2]) - 1]} ${m[1]}` : ''
}
/** A card that expires in month M is valid through the end of M. */
export function certStatus(expires, today = new Date()) {
  if (!expires) return 'none'
  const [y, m] = expires.split('-').map(Number)
  const endOfMonth = new Date(Date.UTC(y, m, 1))
  const t = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  if (t >= endOfMonth.getTime()) return 'expired'
  return endOfMonth.getTime() - t <= 60 * 86400000 ? 'soon' : 'valid'
}
