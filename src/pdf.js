// Resume content -> PDF bytes, entirely on the device. Single column, real text (standard Helvetica, WinAnsi), standard section
// headings, content written top to bottom in reading order, no images and no tables: built to be parsed by applicant tracking systems.
import { PDFDocument, StandardFonts, rgb } from '../vendor/pdf-lib.esm.min.js'

const PAGE = [612, 792] // US Letter
const MARGIN = 50
const SIZES = [10.5, 10, 9.5, 9] // body sizes tried, largest first, to fit one page

function wrap(text, font, size, width) {
  const out = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue }
    if (line) out.push(line)
    if (font.widthOfTextAtSize(word, size) <= width) { line = word; continue }
    let piece = '' // a single word wider than the line is split by character, never dropped
    for (const ch of word) { if (font.widthOfTextAtSize(piece + ch, size) > width) { out.push(piece); piece = ch } else piece += ch }
    line = piece
  }
  if (line) out.push(line)
  return out.length ? out : ['']
}

/** Replace characters the standard fonts cannot encode (emoji, other scripts) instead of failing to build the PDF. */
const encodable = (font) => { const set = new Set(font.getCharacterSet()); return s => [...s].map(ch => (set.has(ch.codePointAt(0)) ? ch : '?')).join('') }

function layout(model, fonts, body) {
  const ops = []
  const width = PAGE[0] - 2 * MARGIN
  let page = 0, y = PAGE[1] - MARGIN
  const need = h => { if (y - h < MARGIN) { page++; y = PAGE[1] - MARGIN } }
  const text = (s, font, size, x = MARGIN, w = width, gap = 1.25) => {
    for (const ln of wrap(s, font, size, w - (x - MARGIN))) { need(size * gap); y -= size * gap; ops.push({ page, kind: 'text', s: ln, x, y, font, size }) }
  }
  text(model.name || ' ', fonts.bold, body + 8, MARGIN, width, 1.2)
  if (model.contact) text(model.contact, fonts.regular, body)
  for (const sec of model.sections) {
    need(body * 3); y -= body * 0.9
    text(sec.heading.toUpperCase(), fonts.bold, body + 0.5)
    y -= 3; ops.push({ page, kind: 'rule', y }); y -= 2
    for (const l of sec.lines ?? []) text(l, fonts.regular, body)
    for (const job of sec.jobs ?? []) {
      need(body * 3.2); y -= body * 0.35
      text(job.title, fonts.bold, body)
      if (job.meta) text(job.meta, fonts.regular, body - 0.5)
      for (const b of job.bullets) {
        const lines = wrap(b, fonts.regular, body, width - 12)
        lines.forEach((ln, i) => { need(body * 1.25); y -= body * 1.25; if (i === 0) ops.push({ page, kind: 'text', s: '•', x: MARGIN + 2, y, font: fonts.regular, size: body }); ops.push({ page, kind: 'text', s: ln, x: MARGIN + 12, y, font: fonts.regular, size: body }) })
      }
    }
  }
  return { ops, pages: page + 1 }
}

/** @returns {Promise<{ bytes: Uint8Array, pages: number, bodySize: number }>} */
export async function renderPdf(model, { date = new Date() } = {}) {
  const doc = await PDFDocument.create()
  const fonts = { regular: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold) }
  const clean = encodable(fonts.regular)
  const safe = { ...model, name: clean(model.name), contact: clean(model.contact), sections: model.sections.map(s => ({ heading: clean(s.heading), lines: s.lines?.map(clean), jobs: s.jobs?.map(j => ({ title: clean(j.title), meta: clean(j.meta), bullets: j.bullets.map(clean) })) })) }
  let chosen
  for (const size of SIZES) { chosen = { size, ...layout(safe, fonts, size) }; if (chosen.pages === 1) break }
  const pages = Array.from({ length: chosen.pages }, () => doc.addPage(PAGE))
  for (const op of chosen.ops) {
    const pg = pages[op.page]
    if (op.kind === 'rule') pg.drawLine({ start: { x: MARGIN, y: op.y }, end: { x: PAGE[0] - MARGIN, y: op.y }, thickness: 0.6, color: rgb(0.55, 0.55, 0.55) })
    else pg.drawText(op.s, { x: op.x, y: op.y, size: op.size, font: op.font, color: rgb(0, 0, 0) })
  }
  doc.setTitle(`${safe.name || 'Resume'} — Resume`)
  doc.setCreator('TradeSheet'); doc.setProducer('TradeSheet')
  doc.setCreationDate(date); doc.setModificationDate(date)
  return { bytes: await doc.save(), pages: chosen.pages, bodySize: chosen.size }
}
