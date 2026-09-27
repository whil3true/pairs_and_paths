import type { CampaignProgress } from "./CampaignProgress.js";

export interface ProgressStore {
  load(): CampaignProgress;
  save(progress: CampaignProgress): void;
  clear(): void;
}
