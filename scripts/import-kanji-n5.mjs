import fs from "node:fs";

const sourcePath = "C:/Games/Nihon/Kanji Test N5/index.html";
const notesPath = "C:/Games/Nihon/Kanji Test N5/Daftar_Kanji_dan_Kosakata_Jepang.md";
const targetPath = "src/data/kanjiN5.ts";

const source = fs.readFileSync(sourcePath, "utf8");
const match = source.match(/const RAW_DATA = (\[[\s\S]*?\]);/);

if (!match) {
  throw new Error("RAW_DATA tidak ditemukan di file sumber.");
}

function cleanCell(value) {
  return value.replace(/\*\*/g, "").trim();
}

function cleanExample(value) {
  return cleanCell(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function readExamplesByKanji(path) {
  if (!fs.existsSync(path)) {
    return new Map();
  }

  const rows = fs
    .readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.startsWith("| **"));

  return new Map(
    rows
      .map((line) => {
        const cells = line
          .split("|")
          .slice(1, -1)
          .map(cleanCell);

        return [cells[0], cleanExample(cells[3] || "")];
      })
      .filter(([kanji, example]) => kanji && example),
  );
}

function getChapter(source) {
  if (String(source).toLowerCase() === "catatan") {
    return 6;
  }

  const chapterMatch = String(source || "").match(/\d+/);
  return chapterMatch ? Number(chapterMatch[0]) : 1;
}

const rawItems = Function(`return ${match[1]}`)();
const examplesByKanji = readExamplesByKanji(notesPath);

const items = rawItems.map((item, index) => {
  return {
    id: `n5-kanji-${String(index + 1).padStart(3, "0")}`,
    type: "kanji",
    level: "n5",
    chapter: getChapter(item.source),
    prompt: item.kanji,
    reading: item.reading,
    meaning: item.meaning,
    example: item.example || examplesByKanji.get(item.kanji) || "",
    status: "ready",
  };
});

const body = `import type { LearningItem } from "./learning";

export const kanjiN5Items: LearningItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(targetPath, body, "utf8");
console.log(`Imported ${items.length} Kanji N5 items to ${targetPath}`);
