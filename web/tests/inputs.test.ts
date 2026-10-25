import { describe, expect, it } from "vitest";

import { toPdf } from "../src/core/convert";
import { decodeText, inputKind } from "../src/core/inputs";
import { extractPageText, openPdf } from "../src/core/pdf";
import { readSample } from "./helpers";

const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

describe("inputKind", () => {
  it("trusts the content for PDFs, whatever the name", () => {
    expect(inputKind("export", bytes("%PDF-1.7\n"))).toBe("pdf");
  });

  it("takes .docx but not other zip files", () => {
    expect(inputKind("Fiche.DOCX", bytes("PK\x03\x04rest"))).toBe("docx");
    expect(inputKind("archive.zip", bytes("PK\x03\x04rest"))).toBeNull();
  });

  it("takes plain text by its extension, refuses the rest", () => {
    expect(inputKind("note.txt", bytes("bonjour"))).toBe("text");
    expect(inputKind("texte-colle-1.txt", new Uint8Array())).toBe("text");
    expect(inputKind("vieux.doc", bytes("\xd0\xcf\x11\xe0"))).toBeNull();
    expect(inputKind("photo.jpg", bytes("\xff\xd8\xff"))).toBeNull();
  });
});

describe("decodeText", () => {
  it("reads UTF-8 and drops its BOM", () => {
    expect(decodeText(new TextEncoder().encode("﻿Hélène"))).toBe("Hélène");
  });

  // Accented letters only: Node 22 decodes 0x80-0x9F (€, ’, œ) as Latin-1,
  // browsers, where the app runs, as Windows-1252.
  it("falls back to Windows-1252", () => {
    expect(decodeText(new Uint8Array([0x48, 0xe9, 0x6c, 0xe8, 0x6e, 0x65]))).toBe("Hélène");
  });
});

describe("toPdf", () => {
  const text = (pdf: Uint8Array) => {
    const doc = openPdf(pdf);
    return Array.from({ length: doc.countPages() }, (_, i) => extractPageText(doc, i).text).join("\n");
  };

  it("lays out a Word document, tables included", () => {
    const pdf = toPdf(readSample("synthetique-fiche-word.docx"), "docx");
    expect(text(pdf)).toContain("0078451236");
    expect(text(pdf)).toContain("PRUVOST");
  });

  it("lays out Windows-1252 text with its accents and line breaks", () => {
    const out = text(toPdf(readSample("synthetique-note-collee.txt"), "text"));
    expect(out).toContain("CHAPUIS Hélène");
    expect(out).toMatch(/0061237845\.\s*\n\s*Entrée/);
  });

  it("gives a PDF back untouched", () => {
    const pdf = readSample("synthetique-autre-hopital.pdf");
    expect(toPdf(pdf, "pdf")).toBe(pdf);
  });
});
