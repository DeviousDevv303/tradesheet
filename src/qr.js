// QR handoff from an agency tablet to the worker's own phone. The code carries the app's address and NOTHING else:
// no profile, no query string, no fragment. Rendering uses vendor/qrcode/qrcode.js (qrcode-generator, MIT), loaded as a classic script.
export function handoffUrl(loc) {
  const u = new URL(loc.href ?? String(loc))
  return `${u.origin}${u.pathname}`
}
export function qrSvg(text, qrcode = globalThis.qrcode) {
  if (typeof qrcode !== 'function') return ''
  const q = qrcode(0, 'M')
  q.addData(text)
  q.make()
  return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true })
}
