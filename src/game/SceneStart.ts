export interface PlayStartData {
  readonly levelNumber: number;
  readonly stageIndex: number;
  readonly persistenceEnabled: boolean;
}

export const playStartData = (levelNumber: number, persistenceEnabled = true): PlayStartData => ({
  levelNumber,
  stageIndex: 0,
  persistenceEnabled,
});
