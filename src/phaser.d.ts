declare namespace Phaser {
  const AUTO: number;

  namespace Scale {
    const FIT: number;
    const CENTER_BOTH: number;
  }

  class Scene {
    constructor(config: { key: string });
    add: {
      text(x: number, y: number, text: string, style: Record<string, unknown>): {
        setOrigin(x?: number, y?: number): unknown;
      };
    };
    scale: { width: number; height: number };
  }

  class Game {
    constructor(config: Record<string, unknown>);
  }
}
