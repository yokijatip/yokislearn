import { kanjiN5Items } from "./kanjiN5";
import { kanjiN4Items } from "./kanjiN4";
import { kotobaN5Items } from "./kotobaN5";
import { kotobaN4Items } from "./kotobaN4";

export type Level = "n5" | "n4";
export type MaterialType = "kanji" | "kotoba";

export interface LearningItem {
  id: string;
  type: MaterialType;
  level: Level;
  chapter: number;
  prompt: string;
  reading?: string;
  meaning: string;
  example?: string;
  note?: string;
  status?: "ready" | "draft";
}

export const levels = [
  { id: "n5", label: "JLPT N5", description: "Kanji N5 dan Minna no Nihongo 1 pelajaran 1 sampai 25." },
  { id: "n4", label: "JLPT N4", description: "Kanji N4 dan Minna no Nihongo 2 pelajaran 26 sampai 50." },
] as const;

export const materialTypes = [
  { id: "kanji", label: "Kanji", description: "Flashcard, kuis arti, bacaan, daftar per grup, dan cetak ulangan." },
  { id: "kotoba", label: "Kotoba", description: "Kosakata per bab dengan latihan acak, pencarian, dan cetak ulangan." },
] as const;

export const learningItems: LearningItem[] = [
  ...kanjiN5Items,
  ...kanjiN4Items,
  ...kotobaN5Items,
  ...kotobaN4Items,
];

export const featureMenu = [
  { title: "Kanji", href: "/belajar/kanji/n5", scope: "Flashcard, kuis, daftar, dan cetak soal" },
  { title: "Kotoba", href: "/belajar/kotoba/n5", scope: "Kosakata per bab dan latihan acak" },
  { title: "Cetak Ulangan", href: "/latihan/cetak", scope: "Pilih level, materi, dan rentang bab" },
  { title: "Games", href: "/games", scope: "Latihan cepat dan score" },
  { title: "Profil", href: "/profil", scope: "Progress hafalan semua user" },
  { title: "Highscore", href: "/highscore", scope: "Ranking score games" },
  { title: "Akun", href: "/akun", scope: "Login, progres, nilai, dan riwayat" },
];

export function getItems(type?: MaterialType, level?: Level) {
  return learningItems.filter((item) => (!type || item.type === type) && (!level || item.level === level));
}

export function getChapters(type: MaterialType, level: Level) {
  return Array.from(new Set(getItems(type, level).map((item) => item.chapter))).sort((a, b) => a - b);
}
