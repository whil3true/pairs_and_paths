import type { AudioEffect } from "./AudioAssetManifest.js";
import type { AudioManager } from "./AudioManager.js";

/** Bootstrap-owned service, intentionally accessed without rebuilding every Phaser Scene. */
let activeManager: AudioManager | null = null;

export const configureAudioRuntime = (manager: AudioManager): void => {
  activeManager = manager;
};

/** An absent audio service is silent, never a gameplay error (e.g. isolated scene tests). */
export const playAudioEffect = (effect: AudioEffect): void => {
  activeManager?.playEffect(effect);
};
