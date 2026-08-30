import fs from "node:fs";

const sourcePath = "C:/Games/Nihon/Kanji Test N5/index.html";
const targetPath = "src/data/kanjiN5.ts";

const source = fs.readFileSync(sourcePath, "utf8");
const match = source.match(/const RAW_DATA = (\[[\s\S]*?\]);/);

if (!match) {
  throw new Error("RAW_DATA tidak ditemukan di file sumber.");
}

const rawItems = Function(`return ${match[1]}`)();
const items = rawItems.map((item, index) => {
  const chapterMatch = String(item.source || "").match(/\d+/);

  return {
    id: `n5-kanji-${String(index + 1).padStart(3, "0")}`,
    type: "kanji",
    level: "n5",
    chapter: chapterMatch ? Number(chapterMatch[0]) : 1,
    prompt: item.kanji,
    reading: item.reading,
    meaning: item.meaning,
    example: item.example || "",
    status: "ready",
  };
});

const body = `import type { LearningItem } from "./learning";

export const kanjiN5Items: LearningItem[] = ${JSON.stringify(items, null, 2)};
`;

fs.writeFileSync(targetPath, body, "utf8");
console.log(`Imported ${items.length} Kanji N5 items to ${targetPath}`);
