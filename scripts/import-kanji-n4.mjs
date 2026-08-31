import fs from "node:fs";

const sourcePath = "C:/Games/Nihon/Kanji N4/kanji-vocab.md";
const targetPath = "src/data/kanjiN4.ts";

const source = fs.readFileSync(sourcePath, "utf8");
const lines = source.split(/\r?\n/);

function clean(value) {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSurface(value) {
  return clean(value).split(/[、,／/]/)[0].trim();
}

function makeExample(kanji, reading, meaning) {
  const surface = firstSurface(kanji);
  const yomi = firstSurface(reading);
  const arti = clean(meaning);

  if (surface.startsWith("~") || surface.startsWith("～")) {
    return `日本語の授業で「${surface}（${yomi}）」を使って文を作ります。 Artinya: Di kelas bahasa Jepang, saya membuat kalimat dengan pola "${surface}" yang berarti ${arti}.`;
  }

  return `日本語の授業で「${surface}（${yomi}）」を勉強します。 Artinya: Di kelas bahasa Jepang, saya belajar kata "${surface}" yang berarti ${arti}.`;
}

let group = null;
const items = [];

for (const line of lines) {
  const groupMatch = line.match(/^##\s+Group\s+(\d+)/);
  if (groupMatch) {
    group = Number(groupMatch[1]);
    continue;
  }

  if (!group || !line.startsWith("|") || line.includes("---") || line.includes("Kanji | Cara Baca")) {
    continue;
  }

  const cells = line
    .split("|")
    .slice(1, -1)
    .map(clean);

  if (cells.length < 3) continue;

  const [kanji, reading, meaning] = cells;
  if (!kanji || !reading || !meaning) continue;

  items.push({
    id: `n4-kanji-${String(items.length + 1).padStart(3, "0")}`,
    type: "kanji",
    level: "n4",
    chapter: group,
    prompt: kanji,
    reading,
    meaning,
    example: makeExample(kanji, reading, meaning),
    status: "ready",
  });
}

const body = `import type { LearningItem } from "./learning";

export const kanjiN4Items: LearningItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(targetPath, body, "utf8");
console.log(`Imported ${items.length} Kanji N4 items to ${targetPath}`);
