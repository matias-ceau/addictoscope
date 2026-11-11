import { describe, expect, it } from "vitest";

import { buildPageText, inlineLabels, readingOrderIndex } from "../src/core/pagetext";
import type { PageText, Rect } from "../src/core/types";
import { lineBoxes, linesBetween, pageLines, repeatedLines } from "../src/notebook/lines";
import type { CloudPolicy } from "../src/cloud/guard";
import type { Manifest } from "../src/core/verify";
import { readingLines, segmentByRules, segmentRulesFirst } from "../src/notebook/segment-rules";

type Row = [text: string, x: number, y: number];
const word = (text: string, x: number, y: number) => ({ text, rect: [x, y, x + text.length * 5, y + 10] as Rect });

/** A page whose text layer gives these rows in this order, each drawn at (x, y). */
const drawn = (page: number, rows: Row[]): PageText =>
  buildPageText(page, 595, 842, rows.map(([text, x, y]) => [word(text, x, y)]), "pdf");

/** A page given line by line, top to bottom: the text layer and the page agree. */
const plain = (page: number, lines: string[]): PageText => drawn(page, lines.map((text, i) => [text, 40, 40 + 14 * i]));

const textOf = (pages: PageText[], o: { start: { page: number; line: number }; end: { page: number; line: number } }) =>
  linesBetween(pages, o.start, o.end).map((l) => l.text);

describe("reading order", () => {
  const box = (x: number, y: number, width = 200): Rect => [x, y, x + width, y + 10];

  it("leaves a page alone when its text layer already follows the page", () => {
    expect(readingOrderIndex([box(40, 40), box(40, 54), box(40, 68), box(40, 82)])).toEqual([0, 1, 2, 3]);
  });

  it("reads a title before the text drawn under it, whatever the text layer says first", () => {
    // Text layer: text, text, title, author. Page: title, author, text, text.
    expect(readingOrderIndex([box(40, 68), box(40, 82), box(40, 40), box(40, 54)])).toEqual([2, 3, 0, 1]);
  });

  it("keeps the text layer's order between columns", () => {
    // Left column then right column, both starting at the same height.
    const order = readingOrderIndex([box(40, 40, 100), box(40, 54, 100), box(300, 40, 100), box(300, 54, 100)]);
    expect(order).toEqual([0, 1, 2, 3]);
  });

  it("reads a footer drawn first after the lines above it", () => {
    expect(readingOrderIndex([box(40, 800), box(40, 40), box(40, 54)])).toEqual([1, 2, 0]);
  });

  it("keeps a line without words at its place", () => {
    expect(readingOrderIndex([box(40, 54), null, box(40, 40)])).toEqual([2, 1, 0]);
  });

  it("finds where each line is drawn from the words of the page", () => {
    const page = buildPageText(0, 595, 842, [[word("Vu", 40, 40), word("ce", 60, 40), word("jour.", 80, 40)], [], [word("RDV", 40, 68)]], "pdf");
    expect(lineBoxes(page)).toEqual([[40, 40, 105, 50], null, [40, 68, 55, 78]]);
    expect(pageLines(page).map((l) => l.text)).toEqual(["Vu ce jour.", "", "RDV"]);
  });
});

describe("labels of a redacted page", () => {
  const text = (lines: { text: string }[][]) => lines.map((l) => l.map((w) => w.text).join(" "));

  it("puts a label drawn at the end of the page back on its line", () => {
    const lines = [
      [word("Rencontre", 40, 40), word("de", 90, 40), word("Mme", 105, 40)],
      [word("ce", 40, 54), word("jour.", 55, 54)],
      [word("[PATIENT]", 130, 40)],
    ];
    expect(text(inlineLabels(lines))).toEqual(["Rencontre de Mme [PATIENT]", "ce jour."]);
  });

  it("never renumbers the lines that follow", () => {
    const lines = [[word("Validé", 40, 40), word("par", 75, 40)], [word("[SOIGNANT_2]", 100, 40)], [word("Vu", 40, 54), word("ce", 55, 54), word("jour.", 70, 54)]];
    expect(text(inlineLabels(lines))).toEqual(["Validé par [SOIGNANT_2]", "", "Vu ce jour."]);
  });

  it("leaves a label alone on its row where it is", () => {
    const lines = [[word("FICHE", 40, 40)], [word("[PATIENT]", 40, 54)], [word("Suivi", 40, 68)]];
    expect(text(inlineLabels(lines))).toEqual(["FICHE", "[PATIENT]", "Suivi"]);
  });
});

describe("running headers and footers", () => {
  const BANNER = ["CENTRE HOSPITALIER FICTIF", "[PATIENT] IPP [IPP]", "Historique des observations"];
  const filler = (n: number, tag: string) => Array.from({ length: n }, (_, i) => `Phrase ${tag} numéro ${"abcdefghij"[i]} du suivi.`);

  it("does not take a phrase of the notes that often comes back for a running header", () => {
    const pages = [
      plain(0, [...BANNER, "Vue ce jour", ...filler(9, "a"), "Page 1/4"]),
      plain(1, [...BANNER, ...filler(4, "b"), "Vue ce jour", ...filler(5, "c"), "Page 2/4"]),
      plain(2, [...BANNER, ...filler(8, "d"), "Vue ce jour", "Va bien.", "Page 3/4"]),
      plain(3, [...BANNER, ...filler(2, "e"), "Vue ce jour", "Page 4/4"]),
    ];
    const repeated = repeatedLines(pages);
    expect(repeated.has("Historique des observations")).toBe(true);
    expect(repeated.has("Page #/#")).toBe(true);
    expect(repeated.has("Vue ce jour")).toBe(false);
  });
});

describe("observations found by rules", () => {
  const BANNER = ["CENTRE HOSPITALIER FICTIF DES TILLEULS", "[PATIENT]", "Né(e) le [NE(E) EN 1975]", "Historique des observations"];

  it("splits a hospital export on its titles and reads the functions", () => {
    const pages = [
      plain(0, [
        ...BANNER,
        "Observation médicale d'entrée du 14/03/2022 (Urgence : Bas)",
        "Validé par [SOIGNANT_1] - Médecin addictologue le 14/03/2022 à 11:02",
        "Adressé par son médecin traitant pour une consommation d'alcool.",
        "Premier verre à 15 ans, quotidien depuis 2015.",
        "Entretien IDE du 21/03/2022",
        "Validé automatiquement le 21/03/2022 à 09:40 par [SOIGNANT_2]",
        "Constantes normales. Éthylotest négatif.",
      ]),
      plain(1, [
        ...BANNER,
        "Observation médicale de suivi du 04/04/2022",
        "Dernière modification le 04/04/2022 à 15:10 par [SOIGNANT_1]",
        "Abstinent depuis deux semaines.",
        "Observation de suivi du 02/05/2022",
        "Validé par [SOIGNANT_3]",
        "- Interne le 02/05/2022 à 10:15",
        "- alcool : reprise le week-end",
      ]),
    ];
    const observations = segmentByRules("historique", pages)!;
    expect(observations.map((o) => [o.date, o.kind, o.authorRole])).toEqual([
      ["2022-03-14", "Observation médicale d'entrée", "Médecin addictologue"],
      ["2022-03-21", "Entretien IDE", "Infirmier(ère)"],
      // No function on this line: the one this author states elsewhere.
      ["2022-04-04", "Observation médicale de suivi", "Médecin addictologue"],
      // The name was cut out of the line, the function follows on the next one.
      ["2022-05-02", "Observation de suivi", "Interne"],
    ]);
    expect(observations.map((o) => [o.start, o.end])).toEqual([
      [{ page: 0, line: 5 }, { page: 0, line: 8 }],
      [{ page: 0, line: 9 }, { page: 0, line: 11 }],
      [{ page: 1, line: 5 }, { page: 1, line: 7 }],
      [{ page: 1, line: 8 }, { page: 1, line: 11 }],
    ]);
  });

  it("carries a note over a page break, banner left out", () => {
    const pages = [
      plain(0, [...BANNER, "Entretien IDE du 21/03/2022", "Validé automatiquement le 21/03/2022 à 09:40 par [SOIGNANT_2]", "Début de la note,", "Page 1/2"]),
      plain(1, [...BANNER, "fin de la note.", "Entretien social du 22/03/2022", "Validé par [SOIGNANT_4] - Assistante sociale le 22/03/2022 à 10:00", "Dossier MDPH déposé.", "Page 2/2"]),
    ];
    const [first, second] = segmentByRules("historique", pages)!;
    expect([first.start, first.end]).toEqual([{ page: 0, line: 5 }, { page: 1, line: 5 }]);
    expect(second.start).toEqual({ page: 1, line: 6 });
    expect(second.authorRole).toBe("Assistante sociale");
  });

  it("finds the notes of an export that draws their text before their titles", () => {
    // What the page shows, top to bottom; the number is the place in the text layer.
    const shown: [order: number, text: string, x?: number][] = [
      [9, "CENTRE HOSPITALIER FICTIF DES TILLEULS"],
      [10, "[PATIENT]"],
      [2, "Observation médicale de suivi du 04/04/2022 (Urgence : Bas)"],
      [3, "Validé par [SOIGNANT_1]"],
      // The end of the validation line is a piece of its own, on the same row.
      [4, "- Médecin le 04/04/2022 à 15:10", 200],
      [0, "Abstinent depuis deux semaines."],
      [1, "Reprise du travail lundi."],
      [7, "Entretien IDE du 11/04/2022"],
      [8, "Validé automatiquement le 11/04/2022 à 09:40 par [SOIGNANT_2]"],
      [5, "Constantes normales."],
      [6, "Éthylotest négatif."],
    ];
    let y = 26;
    const rows = shown.map(([order, text, x]) => ({ order, row: [text, x ?? 40, x ? y : (y += 14)] as Row }));
    const page = drawn(0, rows.sort((a, b) => a.order - b.order).map((r) => r.row));
    expect(pageLines(page)[0].text).toBe("Abstinent depuis deux semaines.");
    // Read as drawn: the title first, the end of its validation line a little later.
    expect(readingLines([page]).slice(2, 7).map((l) => l.text)).toEqual([
      "Observation médicale de suivi du 04/04/2022 (Urgence : Bas)",
      "Validé par [SOIGNANT_1]",
      "Abstinent depuis deux semaines.",
      "Reprise du travail lundi.",
      "- Médecin le 04/04/2022 à 15:10",
    ]);

    const observations = segmentByRules("historique", [page])!;
    expect(observations.map((o) => [o.date, o.authorRole])).toEqual([
      ["2022-04-04", "Médecin"],
      ["2022-04-11", "Infirmier(ère)"],
    ]);
    // Anchored in the text layer: each note is its block of lines there, text first.
    expect(observations.map((o) => [o.start.line, o.end.line])).toEqual([
      [1, 5],
      [6, 9],
    ]);
    expect(textOf([page], observations[1]).slice(0, 2)).toEqual(["Constantes normales.", "Éthylotest négatif."]);
  });

  it("reads Word history titles, wrapped or not", () => {
    const pages = [
      plain(0, [
        "14/02/2024 10:30 : Observation psychiatrique de suivi ( [SOIGNANT_1] - Psychiatre )",
        "Humeur stable. Poursuite du traitement.",
        "21/02/2024 09:00 : Entretien infirmier ( [SOIGNANT_2]",
        "- Infirmier(ère) )",
        "Délivrance du traitement.",
        "28/02/2024 14:15 : Synthèse de la réunion",
        "pluridisciplinaire ( [SOIGNANT_3] - Cadre de santé )",
        "Projet de sortie discuté.",
      ]),
    ];
    const observations = segmentByRules("historique", pages)!;
    expect(observations.map((o) => [o.date, o.kind, o.authorRole, o.start.line, o.end.line])).toEqual([
      ["2024-02-14", "Observation psychiatrique de suivi", "Psychiatre", 1, 2],
      ["2024-02-21", "Entretien infirmier", "Infirmier(ère)", 3, 5],
      ["2024-02-28", "Synthèse de la réunion pluridisciplinaire", "Cadre de santé", 6, 8],
    ]);
  });

  it("keeps a title and a validation line that stand at the same place of every page", () => {
    const one = (page: number, day: string, text: string[]) =>
      plain(page, [`Observation de suivi du ${day}/03/2022`, `Validé par [SOIGNANT_1] - Psychologue le ${day}/03/2022 à 10:00`, ...text]);
    const pages = [
      one(0, "07", ["Sommeil perturbé depuis la reprise.", "Poursuite du suivi."]),
      one(1, "14", ["Dort mieux.", "A revu sa sœur."]),
      one(2, "21", ["Envisage une cure.", "Dossier à constituer."]),
    ];
    // By their place alone these lines pass for a running header.
    expect(repeatedLines(pages).has("Observation de suivi du #/#/#")).toBe(true);
    const observations = segmentByRules("historique", pages)!;
    expect(observations.map((o) => [o.date, o.authorRole, o.start.page])).toEqual([
      ["2022-03-07", "Psychologue", 0],
      ["2022-03-14", "Psychologue", 1],
      ["2022-03-21", "Psychologue", 2],
    ]);
  });

  it("gives up on a layout it does not know", () => {
    expect(segmentByRules("courrier", [plain(0, ["Bordeaux, le 12/03/2022", "Cher confrère,", "J'ai vu ce jour votre patient du 12/03/2022.", "Bien confraternellement."])])).toBeNull();
  });
});

describe("rules first, the model for the rest", () => {
  const policy: CloudPolicy = { kind: "openrouter-zdr", apiKey: "sk-test", model: "test/model" };
  const manifest = { verified: true, reviewedByHuman: true, leaks: [] } as unknown as Manifest;
  const exported = [
    plain(0, [
      "CENTRE HOSPITALIER FICTIF DES TILLEULS",
      "Historique des observations",
      "Observation médicale d'entrée du 14/03/2022 (Urgence : Bas)",
      "Validé par [SOIGNANT_1] - Médecin addictologue le 14/03/2022 à 11:02",
      "Adressé par son médecin traitant.",
      "Entretien IDE du 21/03/2022",
      "Validé automatiquement le 21/03/2022 à 09:40 par [SOIGNANT_2]",
      "Constantes normales.",
    ]),
  ];
  const letter = [plain(0, ["Bordeaux, le 12/03/2022", "Cher confrère,", "J'ai vu ce jour votre patient.", "Bien confraternellement."])];

  /** Answers as the model would, and keeps what it was asked. */
  const model = (asked: string[], imagesMade: { n: number }) => ({
    policy,
    manifest,
    images: () => {
      imagesMade.n++;
      return { 0: "data:image/png;base64,AAAA" };
    },
    fetchImpl: (async (_url: string, init: RequestInit) => {
      asked.push(JSON.parse(String(init.body)).response_format.json_schema.name);
      const observations = [{ start: { page: 1, line: 1 }, end: { page: 1, line: 4 }, date: "2022-03-12", kind: "courrier", author_role: null, continues_previous: false, summary: "" }];
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ observations }) } }] }), { status: 200 });
    }) as unknown as typeof fetch,
  });

  it("splits a known export here: no request, no page image", async () => {
    const asked: string[] = [];
    const imagesMade = { n: 0 };
    const { observations, by } = await segmentRulesFirst({ doc: "historique", pages: exported, ...model(asked, imagesMade) });
    expect(by).toBe("rules");
    expect(observations.map((o) => o.date)).toEqual(["2022-03-14", "2022-03-21"]);
    expect(asked).toEqual([]);
    expect(imagesMade.n).toBe(0);
  });

  it("asks the model for a layout the rules do not know", async () => {
    const asked: string[] = [];
    const imagesMade = { n: 0 };
    const { observations, by } = await segmentRulesFirst({ doc: "courrier", pages: letter, ...model(asked, imagesMade) });
    expect(by).toBe("model");
    expect(observations).toHaveLength(1);
    expect(asked).toEqual(["segmentation"]);
    expect(imagesMade.n).toBe(1);
  });

  it("asks the model for every document when the rules are switched off", async () => {
    const asked: string[] = [];
    const { by } = await segmentRulesFirst({ doc: "historique", pages: exported, ...model(asked, { n: 0 }), rules: false });
    expect(by).toBe("model");
    expect(asked).toEqual(["segmentation"]);
  });
});
