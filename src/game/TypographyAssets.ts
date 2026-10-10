import type { SupportedLocale } from "./Localization.js";

export const FONT_LOAD_TIMEOUT_MS = 4000;

export interface ProductionFontProbe {
  readonly family: "Literata" | "Onest";
  readonly weight: 400 | 500 | 600;
  readonly size: number;
  readonly text: string;
}

export const getProductionFontProbes = (locale: SupportedLocale): readonly ProductionFontProbe[] =>
  locale === "ru"
    ? Object.freeze([
      Object.freeze({ family: "Onest", weight: 600, size: 38, text: "Уютная галерея" }),
      Object.freeze({ family: "Onest", weight: 400, size: 17, text: "Открыто 80 из 100" }),
      Object.freeze({ family: "Onest", weight: 500, size: 16, text: "Осталось: 12" }),
      Object.freeze({ family: "Onest", weight: 600, size: 19, text: "Продолжить" }),
    ])
    : Object.freeze([
      Object.freeze({ family: "Onest", weight: 600, size: 38, text: "Cozy Gallery" }),
      Object.freeze({ family: "Onest", weight: 400, size: 17, text: "Unlocked 80 of 100" }),
      Object.freeze({ family: "Onest", weight: 500, size: 16, text: "Remaining: 12" }),
      Object.freeze({ family: "Onest", weight: 600, size: 19, text: "Continue" }),
    ]);

const fontShorthand = ({ family, weight, size }: ProductionFontProbe): string =>
  `${weight} ${size}px "${family}"`;

export const loadProductionFonts = async (locale: SupportedLocale): Promise<boolean> => {
  if (typeof document === "undefined" || document.fonts === undefined) return false;
  const probes = getProductionFontProbes(locale);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const loaded = await Promise.race([
      Promise.all(probes.map((probe) => document.fonts.load(fontShorthand(probe), probe.text))).then(() => true),
      new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => resolve(false), FONT_LOAD_TIMEOUT_MS);
      }),
    ]);
    return loaded && probes.every((probe) => document.fonts.check(fontShorthand(probe), probe.text));
  } catch {
    return false;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};
