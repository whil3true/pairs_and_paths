import { CHAPTER_COUNT, getChapterNumber } from "./LevelSequence.js";

export type ChapterTitleKey = `chapter${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

export interface ChapterPresentation {
  readonly number: number;
  readonly titleKey: ChapterTitleKey;
  readonly primaryColor: number;
  readonly secondaryColor: number;
  readonly accentColor: number;
}

export const CHAPTER_PRESENTATIONS: readonly ChapterPresentation[] = Object.freeze([
  { number: 1, titleKey: "chapter1", primaryColor: 0xe9b481, secondaryColor: 0xd9c5a5, accentColor: 0x245f5d },
  { number: 2, titleKey: "chapter2", primaryColor: 0xd99a4e, secondaryColor: 0x765143, accentColor: 0x356b67 },
  { number: 3, titleKey: "chapter3", primaryColor: 0xd9828d, secondaryColor: 0x789477, accentColor: 0x2f6763 },
  { number: 4, titleKey: "chapter4", primaryColor: 0x405b6a, secondaryColor: 0xe8d7b8, accentColor: 0x8d4f55 },
  { number: 5, titleKey: "chapter5", primaryColor: 0x5f7f61, secondaryColor: 0xa8c9cd, accentColor: 0xb96f4e },
  { number: 6, titleKey: "chapter6", primaryColor: 0x4f93a6, secondaryColor: 0xf2deb8, accentColor: 0xc86e59 },
  { number: 7, titleKey: "chapter7", primaryColor: 0x3f6863, secondaryColor: 0x8fa9b5, accentColor: 0xc9953a },
  { number: 8, titleKey: "chapter8", primaryColor: 0xd48632, secondaryColor: 0x59443d, accentColor: 0x355f5b },
  { number: 9, titleKey: "chapter9", primaryColor: 0xb8cdd5, secondaryColor: 0x294b5b, accentColor: 0xd6a34a },
  { number: 10, titleKey: "chapter10", primaryColor: 0x263e62, secondaryColor: 0x287477, accentColor: 0xc79a43 },
]);

export const getChapterPresentation = (chapterNumber: number): ChapterPresentation => {
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > CHAPTER_COUNT) {
    throw new RangeError(`chapterNumber must be an integer from 1 through ${CHAPTER_COUNT}`);
  }
  return CHAPTER_PRESENTATIONS[chapterNumber - 1]!;
};

export const getLevelChapterPresentation = (levelNumber: number): ChapterPresentation =>
  getChapterPresentation(getChapterNumber(levelNumber));
