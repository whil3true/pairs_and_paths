export type SupportedLocale = "ru" | "en";

export const DEFAULT_LOCALE: SupportedLocale = "ru";

const russianPairWord = (count: number): "пара" | "пары" | "пар" => {
  const absolute = Math.abs(Math.trunc(count));
  const modulo100 = absolute % 100;
  if (modulo100 >= 11 && modulo100 <= 14) return "пар";
  const modulo10 = absolute % 10;
  if (modulo10 === 1) return "пара";
  if (modulo10 >= 2 && modulo10 <= 4) return "пары";
  return "пар";
};

export interface UiStrings {
  readonly gameTitle: string;
  readonly brandTitle: string;
  readonly brandDescriptor: string;
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
  readonly galleryChapterProgress: (opened: number, total: number) => string;
  readonly levelLabel: (level: number) => string;
  readonly gallerySoon: string;
  readonly galleryLoading: string;
  readonly galleryUnavailable: string;
  readonly back: string;
  readonly artworkLoading: string;
  readonly artworkUnavailable: string;
  readonly rewardHeading: string;
  readonly rewardContinue: string;
  readonly levelComplete: string;
  readonly campaignComplete: string;
  readonly nextLevel: string;
  readonly restartFromLevelOne: string;
  readonly replayLevel: string;
  readonly menu: string;
  readonly pauseTitle: string;
  readonly pauseResume: string;
  readonly pauseRestart: string;
  readonly pauseExit: string;
  readonly restartConfirmTitle: string;
  readonly restartConfirmBody: string;
  readonly restartConfirmAction: string;
  readonly exitConfirmTitle: string;
  readonly exitConfirmBody: string;
  readonly exitConfirmAction: string;
  readonly cancel: string;
  readonly gameplayPause: string;
  readonly gameplayHint: string;
  readonly remainingPairs: (count: number) => string;
  readonly stageLabel: (stage: number, total: number) => string;
  readonly chapterTitles: readonly [string, string, string, string, string, string, string, string, string, string];
}

const ru = Object.freeze<UiStrings>({
    gameTitle: "Соедини пары: Уютная галерея",
    brandTitle: "Уютная галерея",
    brandDescriptor: "Соедини пары",
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
    galleryChapterProgress: (opened, total) => `Открыто ${opened} из ${total}`,
    levelLabel: (level) => `Уровень ${level}`,
    gallerySoon: "Скоро",
    galleryLoading: "Загрузка…",
    galleryUnavailable: "Недоступно",
    back: "Назад",
    artworkLoading: "Загрузка картины…",
    artworkUnavailable: "Картина недоступна",
    rewardHeading: "Картина открыта",
    rewardContinue: "Продолжить",
    levelComplete: "Уровень пройден",
    campaignComplete: "Кампания пройдена",
    nextLevel: "Следующий уровень",
    restartFromLevelOne: "Начать с уровня 1",
    replayLevel: "Переиграть уровень",
    menu: "Меню",
    pauseTitle: "Пауза",
    pauseResume: "Продолжить",
    pauseRestart: "Начать уровень заново",
    pauseExit: "Выйти в меню",
    restartConfirmTitle: "Начать заново?",
    restartConfirmBody: "Текущий уровень начнётся с первого этапа.",
    restartConfirmAction: "Начать заново",
    exitConfirmTitle: "Выйти в меню?",
    exitConfirmBody: "Незавершённый уровень не сохранится.",
    exitConfirmAction: "Выйти",
    cancel: "Отмена",
    gameplayPause: "Пауза",
    gameplayHint: "Подсказка",
    remainingPairs: (count) => `Осталось: ${count} ${russianPairWord(count)}`,
    stageLabel: (stage, total) => `Этап ${stage}/${total}`,
    chapterTitles: [
      "Утро дома", "Чай и выпечка", "Цветочные лавки", "Книги и письма", "Сады и дворики",
      "У моря", "Дороги и станции", "Осенние огни", "Зимние окна", "Тихая магия",
    ],
  });
const en = Object.freeze<UiStrings>({
    gameTitle: "Pair Connect: Cozy Gallery",
    brandTitle: "Cozy Gallery",
    brandDescriptor: "Pair Connect",
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
    galleryChapterProgress: (opened, total) => `Unlocked ${opened} of ${total}`,
    levelLabel: (level) => `Level ${level}`,
    gallerySoon: "Soon",
    galleryLoading: "Loading…",
    galleryUnavailable: "Unavailable",
    back: "Back",
    artworkLoading: "Loading artwork…",
    artworkUnavailable: "Artwork unavailable",
    rewardHeading: "Artwork unlocked",
    rewardContinue: "Continue",
    levelComplete: "Level complete",
    campaignComplete: "Campaign complete",
    nextLevel: "Next level",
    restartFromLevelOne: "Restart from Level 1",
    replayLevel: "Replay level",
    menu: "Menu",
    pauseTitle: "Paused",
    pauseResume: "Resume",
    pauseRestart: "Restart level",
    pauseExit: "Exit to menu",
    restartConfirmTitle: "Restart level?",
    restartConfirmBody: "The current level will restart from Stage 1.",
    restartConfirmAction: "Restart",
    exitConfirmTitle: "Exit to menu?",
    exitConfirmBody: "Unfinished level progress will not be saved.",
    exitConfirmAction: "Exit",
    cancel: "Cancel",
    gameplayPause: "Pause",
    gameplayHint: "Hint",
    remainingPairs: (count) => `Remaining: ${count} ${count === 1 ? "pair" : "pairs"}`,
    stageLabel: (stage, total) => `Stage ${stage}/${total}`,
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
