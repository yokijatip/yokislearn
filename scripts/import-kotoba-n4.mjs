import fs from "node:fs";

const sourcePath = "C:/Games/Nihon/Kotoba Minna No Nihonggo 2/Kosakata_Minna_no_Nihongo_26-50.md";
const targetPath = "src/data/kotobaN4.ts";

const source = fs.readFileSync(sourcePath, "utf8");
const lines = source.split(/\r?\n/);

function stripMarkdown(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripReadingParens(value) {
  return value
    .replace(/[（(][ぁ-んァ-ンー\s]+[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanKana(value) {
  return stripMarkdown(value)
    .replace(/\s+[IⅡIIⅢIII]+$/i, "")
    .replace(/\s*\[[^\]]+\]/g, "")
    .replace(/^※/, "")
    .trim();
}

function cleanKanji(value) {
  return stripReadingParens(stripMarkdown(value))
    .replace(/\s+[IⅡIIⅢIII]+$/i, "")
    .replace(/\s*\[[^\]]+\]/g, "")
    .replace(/^※/, "")
    .trim();
}

function cleanMeaning(value) {
  return stripMarkdown(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExample(item) {
  const surface = (item.kanji || item.kana).split(/[、,／/]/)[0].trim();
  const kana = item.kana.replace(/\s+[IⅡIIⅢIII]+$/i, "").trim();

  if (kana.includes("ます") || surface.includes("ます")) {
    return `明日、${surface}。`;
  }

  if (kana.endsWith("い") || surface.endsWith("い")) {
    return `この町は${surface}です。`;
  }

  if (kana.includes("[な]") || surface.includes("[な]")) {
    return `ここは${surface.replace("[な]", "")}です。`;
  }

  if (kana.startsWith("～") || surface.startsWith("～")) {
    return `${surface}を使って文を作ります。`;
  }

  return `これは${surface}です。`;
}

let chapter = null;
const items = [];

for (const line of lines) {
  const chapterMatch = line.match(/^##\s+Pelajaran\s+(\d+)/);
  if (chapterMatch) {
    chapter = Number(chapterMatch[1]);
    continue;
  }

  if (!chapter || !line.startsWith("* **")) continue;

  const bulletMatch = line.match(/^\*\s+(.+?)\s*:\s*(.+)$/);
  if (!bulletMatch) continue;

  const left = bulletMatch[1];
  const meaning = cleanMeaning(bulletMatch[2]);
  const parts = left.split(/\s+\/\s+/);
  const kanaMatch = parts[0].match(/\*\*(.*?)\*\*/);
  const kanjiMatch = parts.slice(1).join(" / ").match(/\*\*(.*?)\*\*/);
  const kana = cleanKana(kanaMatch ? kanaMatch[1] : parts[0]);
  const kanji = kanjiMatch ? cleanKanji(kanjiMatch[1]) : "";

  if (!kana || !meaning) continue;

  const item = { kana, kanji };
  items.push({
    id: `n4-kotoba-${String(items.length + 1).padStart(3, "0")}`,
    type: "kotoba",
    level: "n4",
    chapter,
    prompt: kana,
    reading: kanji,
    meaning,
    example: makeExample(item),
    status: "ready",
  });
}

const body = `import type { LearningItem } from "./learning";

export const kotobaN4Items: LearningItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(targetPath, body, "utf8");
console.log(`Imported ${items.length} Kotoba N4 items to ${targetPath}`);
