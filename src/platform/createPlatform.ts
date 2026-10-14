import type { PlatformService } from "./PlatformService.js";
import { WebPlatform } from "./WebPlatform.js";
import { YandexPlatform } from "./YandexPlatform.js";
import type { YandexGamesGlobal, YandexSdk } from "./YandexSdkTypes.js";

export const YANDEX_SDK_PATH = "/sdk.js";
export const SDK_SCRIPT_TIMEOUT_MS = 7000;
export const SDK_INIT_TIMEOUT_MS = 12000;

/** Absence is acceptable on GitHub Pages; failed initialization is not. */
export class YandexSdkUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YandexSdkUnavailableError";
  }
}

export const looksLikeYandexHost = (hostname: string, referrer = ""): boolean => {
  const host = hostname.toLowerCase();
  const isYandex = (value: string): boolean =>
    /(^|\.)(yandex\.(ru|com|net|by|kz|uz)|ya\.ru)$/.test(value)
    || /(^|\.)yandex-games\./.test(value);
  if (isYandex(host)) return true;
  try { return isYandex(new URL(referrer).hostname.toLowerCase()); } catch { return false; }
};

export const loadYandexSdk = async (
  win: Window = window, doc: Document = document,
): Promise<YandexSdk> => {
  const global = win as Window & { YaGames?: YandexGamesGlobal };
  if (!global.YaGames) {
    await new Promise<void>((resolve, reject) => {
      const script = doc.createElement("script");
      script.src = YANDEX_SDK_PATH;
      script.async = true;
      let settled = false;
      const settle = (error?: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        script.onload = null;
        script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      const timeout = setTimeout(
        () => settle(new YandexSdkUnavailableError("Yandex SDK script load timed out")),
        SDK_SCRIPT_TIMEOUT_MS,
      );
      script.onload = () => settle();
      script.onerror = () => settle(new YandexSdkUnavailableError("Yandex SDK script is unavailable"));
      (doc.head ?? doc.body).appendChild(script);
    });
  }
  if (!global.YaGames) {
    throw new YandexSdkUnavailableError("Yandex SDK script loaded without YaGames");
  }
  // Distinguish a genuine SDK initialization failure from an absent SDK script.
  return await Promise.race([
    global.YaGames.init(),
    new Promise<never>((_resolve, reject) => {
      // This timer is unref'd only in Node test environment; browser handles it.
      setTimeout(() => reject(new Error("Yandex SDK initialization timed out")), SDK_INIT_TIMEOUT_MS);
    }),
  ]);
};

export interface CreatePlatformOptions {
  readonly loadSdk: () => Promise<YandexSdk>;
  readonly fallback: () => PlatformService;
  readonly isYandexEnvironment: boolean;
}

export const createPlatform = async (options: CreatePlatformOptions = {
  loadSdk: () => loadYandexSdk(),
  fallback: () => new WebPlatform(),
  isYandexEnvironment: looksLikeYandexHost(window.location.hostname, document.referrer),
}): Promise<PlatformService> => {
  try {
    const sdk = await options.loadSdk();
    return new YandexPlatform(sdk);
  } catch (error) {
    if (error instanceof YandexSdkUnavailableError && !options.isYandexEnvironment) {
      // Intentionally normal for local dev and GitHub Pages, where /sdk.js is 404.
      return options.fallback();
    }
    throw error;
  }
};
