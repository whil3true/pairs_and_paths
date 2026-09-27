import { getResumeLevel, type CampaignProgress } from "../progress/CampaignProgress.js";
import type { DebugStartPosition } from "./DebugStart.js";

export interface CampaignStartup {
  readonly position: DebugStartPosition;
  readonly persistenceEnabled: boolean;
}

export const resolveCampaignStartup = (
  progress: CampaignProgress,
  debugStart: DebugStartPosition | null,
): CampaignStartup => debugStart === null
  ? { position: { levelNumber: getResumeLevel(progress), stageIndex: 0 }, persistenceEnabled: true }
  : { position: debugStart, persistenceEnabled: false };
