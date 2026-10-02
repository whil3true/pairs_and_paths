export const GAMEPLAY_HUD = Object.freeze({
  pause: Object.freeze({ left: 24, top: 20, width: 104, height: 48, centerX: 76, centerY: 44 }),
  hint: Object.freeze({ left: 352, top: 20, width: 104, height: 48, centerX: 404, centerY: 44 }),
  statusY: 80,
  statusLeftX: 24,
  statusRightX: 456,
  stageCenterX: 240,
  stageY: 116,
});

export const russianPairWord = (count: number): "пара" | "пары" | "пар" => {
  const absolute = Math.abs(Math.trunc(count));
  const modulo100 = absolute % 100;
  if (modulo100 >= 11 && modulo100 <= 14) return "пар";
  const modulo10 = absolute % 10;
  if (modulo10 === 1) return "пара";
  if (modulo10 >= 2 && modulo10 <= 4) return "пары";
  return "пар";
};

export const formatRemainingPairs = (count: number): string =>
  `Осталось: ${count} ${russianPairWord(count)}`;
