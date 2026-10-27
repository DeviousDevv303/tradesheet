import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { handoffUrl, qrSvg } from '../src/qr.js'
const qrcode = createRequire(import.meta.url)('../vendor/qrcode/qrcode.js')

test('the handoff code carries only the app address: no query, no fragment, no data', () => {
  assert.equal(handoffUrl({ href: 'https://example.github.io/tradesheet/?mode=assist&name=Alex#jobs' }), 'https://example.github.io/tradesheet/')
})
test('the QR renders as a self-contained SVG with no inline styles (the page CSP forbids them)', () => {
  const svg = qrSvg('https://example.github.io/tradesheet/', qrcode)
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/); assert.equal(/style=/.test(svg), false)
  assert.equal(qrSvg('x', undefined), '')
})
