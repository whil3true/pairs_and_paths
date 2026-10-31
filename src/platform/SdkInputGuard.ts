import type { PlatformService } from "./PlatformService.js";

export interface SceneInputState {
  readonly key: string;
  readonly input: { enabled: boolean };
}

/** Applies platform pauses to non-gameplay Phaser screens. PlayScene already
 * owns its own SDK input and clock freeze, including the browser Pause overlay.
 */
export class SdkInputGuard {
  private paused: boolean;
  private readonly previous = new Map<SceneInputState["input"], boolean>();
  private readonly detachPause: () => void;
  private readonly detachResume: () => void;

  constructor(
    platform: PlatformService,
    private readonly activeScenes: () => readonly SceneInputState[],
  ) {
    this.paused = platform.isPaused;
    this.detachPause = platform.onPause(() => {
      this.paused = true;
      this.sync();
    });
    this.detachResume = platform.onResume(() => {
      this.paused = false;
      this.sync();
    });
    this.sync();
  }

  sync(): void {
    if (!this.paused) {
      for (const [input, original] of this.previous) input.enabled = original;
      this.previous.clear();
      return;
    }
    for (const scene of this.activeScenes()) {
      if (scene.key === "PlayScene") continue;
      const input = scene.input;
      if (!this.previous.has(input)) this.previous.set(input, input.enabled);
      input.enabled = false;
    }
  }

  dispose(): void {
    this.detachPause();
    this.detachResume();
    this.paused = false;
    this.sync();
  }
}

export const attachSdkInputGuard = (game: Phaser.Game, platform: PlatformService): (() => void) => {
  const guard = new SdkInputGuard(platform, () => game.scene.getScenes(true).map((scene) => ({
    key: scene.scene.key, input: scene.input,
  })));
  const sync = (): void => guard.sync();
  game.events.on(Phaser.Core.Events.POST_RENDER, sync);
  const dispose = (): void => {
    game.events.off(Phaser.Core.Events.POST_RENDER, sync);
    guard.dispose();
  };
  game.events.once(Phaser.Core.Events.DESTROY, dispose);
  return dispose;
};
