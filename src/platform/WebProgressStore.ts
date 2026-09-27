import {
  initialCampaignProgress, parseCampaignProgress, serializeCampaignProgress, type CampaignProgress,
} from "../progress/CampaignProgress.js";
import type { ProgressStore } from "../progress/ProgressStore.js";

export const CAMPAIGN_PROGRESS_STORAGE_KEY = "pairs-and-paths:campaign-progress";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class WebProgressStore implements ProgressStore {
  constructor(private readonly getStorage: () => StorageLike = () => window.localStorage) {}

  load(): CampaignProgress {
    try {
      const stored = this.getStorage().getItem(CAMPAIGN_PROGRESS_STORAGE_KEY);
      return stored === null ? initialCampaignProgress() : parseCampaignProgress(stored);
    } catch {
      return initialCampaignProgress();
    }
  }

  save(progress: CampaignProgress): void {
    try {
      this.getStorage().setItem(CAMPAIGN_PROGRESS_STORAGE_KEY, serializeCampaignProgress(progress));
    } catch {
      // Storage availability is optional; gameplay must continue.
    }
  }

  clear(): void {
    try {
      this.getStorage().removeItem(CAMPAIGN_PROGRESS_STORAGE_KEY);
    } catch {
      // A blocked storage backend behaves like a non-persistent session.
    }
  }
}
