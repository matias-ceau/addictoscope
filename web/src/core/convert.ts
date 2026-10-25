/**
 * Plain text, pasted text and Word documents are laid out into a PDF when
 * they are opened, so they go through exactly the same detection, review,
 * redaction and verification as an exported PDF. MuPDF reads them; nothing
 * leaves the browser.
 */
import * as mupdf from "mupdf";

import { decodeText, type InputKind } from "./inputs";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
/** A4 in points, body text size: the converted PDF looks like any other export. */
const PAGE_W = 595;
const PAGE_H = 842;
const FONT_SIZE = 10;

/** The document as PDF bytes: a PDF is returned as is. */
export function toPdf(bytes: Uint8Array, kind: InputKind): Uint8Array {
  if (kind === "pdf") return bytes;
  const source =
    kind === "docx"
      ? mupdf.Document.openDocument(bytes, DOCX_MIME)
      : mupdf.Document.openDocument(new TextEncoder().encode(decodeText(bytes).replace(/\r\n?/g, "\n")), "text/plain");
  source.layout(PAGE_W, PAGE_H, FONT_SIZE);
  const out = new mupdf.Buffer();
  const writer = new mupdf.DocumentWriter(out, "pdf", "");
  for (let i = 0; i < source.countPages(); i++) {
    const page = source.loadPage(i);
    const device = writer.beginPage(page.getBounds());
    page.run(device, mupdf.Matrix.identity);
    writer.endPage();
  }
  writer.close();
  return out.asUint8Array().slice();
}
