export type SupportedLocale = "ru" | "en";

export const DEFAULT_LOCALE: SupportedLocale = "ru";

export interface UiStrings {
  readonly gameTitle: string;
  readonly tagline: string;
  readonly play: string;
  readonly continueLevel: (level: number) => string;
  readonly playAgainLevel: (level: number) => string;
  readonly levels: string;
  readonly gallery: string;
  readonly openedProgress: (completed: number, total: number) => string;
  readonly collectionComplete: (completed: number, total: number) => string;
  readonly chapterLabel: (chapter: number) => string;
  readonly chapterHeader: (chapter: number, title: string) => string;
  readonly globalProgress: (completed: number, total: number) => string;
  readonly backToMenu: string;
  readonly rewardHeading: string;
  readonly rewardContinue: string;
  readonly levelComplete: string;
  readonly campaignComplete: string;
  readonly nextLevel: string;
  readonly restartFromLevelOne: string;
  readonly replayLevel: string;
  readonly menu: string;
  readonly chapterTitles: readonly [string, string, string, string, string, string, string, string, string, string];
}

const ru = Object.freeze<UiStrings>({
    gameTitle: "Соедини пары: Уютная галерея",
    tagline: "Открывайте уютные картины, соединяя пары",
    play: "Играть",
    continueLevel: (level) => `Продолжить · Уровень ${level}`,
    playAgainLevel: (level) => `Играть снова · Уровень ${level}`,
    levels: "Уровни",
    gallery: "Галерея",
    openedProgress: (completed, total) => `Открыто ${completed} из ${total}`,
    collectionComplete: (completed, total) => `Коллекция: ${completed} из ${total}`,
    chapterLabel: (chapter) => `Глава ${chapter}`,
    chapterHeader: (chapter, title) => `Глава ${chapter} · ${title}`,
    globalProgress: (completed, total) => `${completed} / ${total} · 10 уровней`,
    backToMenu: "Назад в меню",
    rewardHeading: "Картина открыта",
    rewardContinue: "Продолжить",
    levelComplete: "Уровень пройден",
    campaignComplete: "Кампания пройдена",
    nextLevel: "Следующий уровень",
    restartFromLevelOne: "Начать с уровня 1",
    replayLevel: "Переиграть уровень",
    menu: "Меню",
    chapterTitles: [
      "Утро дома", "Чай и выпечка", "Цветочные лавки", "Книги и письма", "Сады и дворики",
      "У моря", "Дороги и станции", "Осенние огни", "Зимние окна", "Тихая магия",
    ],
  });
const en = Object.freeze<UiStrings>({
    gameTitle: "Pair Connect: Cozy Gallery",
    tagline: "Connect pairs and uncover cozy artwork",
    play: "Play",
    continueLevel: (level) => `Continue · Level ${level}`,
    playAgainLevel: (level) => `Play Again · Level ${level}`,
    levels: "Levels",
    gallery: "Gallery",
    openedProgress: (completed, total) => `Unlocked ${completed} of ${total}`,
    collectionComplete: (completed, total) => `Collection: ${completed} of ${total}`,
    chapterLabel: (chapter) => `Chapter ${chapter}`,
    chapterHeader: (chapter, title) => `Chapter ${chapter} · ${title}`,
    globalProgress: (completed, total) => `${completed} / ${total} · 10 levels`,
    backToMenu: "Back to Menu",
    rewardHeading: "Artwork unlocked",
    rewardContinue: "Continue",
    levelComplete: "Level complete",
    campaignComplete: "Campaign complete",
    nextLevel: "Next level",
    restartFromLevelOne: "Restart from Level 1",
    replayLevel: "Replay level",
    menu: "Menu",
    chapterTitles: [
      "Morning at Home", "Tea & Baking", "Flower Shops", "Books & Letters", "Gardens & Courtyards",
      "By the Sea", "Roads & Stations", "Autumn Lights", "Winter Windows", "Quiet Magic",
    ],
  });

export const UI_STRINGS: Readonly<Record<SupportedLocale, UiStrings>> = Object.freeze({ ru, en });

export const getUiStrings = (locale: SupportedLocale): UiStrings => UI_STRINGS[locale];

export const getChapterTitle = (locale: SupportedLocale, chapterNumber: number): string => {
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 10) {
    throw new RangeError("chapterNumber must be an integer from 1 through 10");
  }
  return UI_STRINGS[locale].chapterTitles[chapterNumber - 1]!;
};
