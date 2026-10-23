export interface ArtworkTextureStore {
  exists(key: string): boolean;
  remove(key: string): unknown;
}

/**
 * Full artwork is decoded to roughly 4 MiB of RGBA pixels per 1024x1024 image.
 * Keep the active texture plus two recent entries for replay/back navigation.
 */
export const FULL_ARTWORK_CACHE_LIMIT = 3;

interface ArtworkTextureEntry {
  activeUses: number;
}

/**
 * A small LRU for full-resolution artwork only. Active scene leases are never
 * evicted; the limit is restored as soon as a lease is released.
 */
export class FullArtworkTextureCache {
  private readonly entries = new Map<string, ArtworkTextureEntry>();

  constructor(private readonly maxEntries = FULL_ARTWORK_CACHE_LIMIT) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError("Full artwork cache size must be a positive integer");
    }
  }

  retain(key: string, textures: ArtworkTextureStore): void {
    const entry = this.entries.get(key) ?? { activeUses: 0 };
    entry.activeUses += 1;
    this.touch(key, entry);
    this.evict(textures);
  }

  markLoaded(key: string, textures: ArtworkTextureStore): void {
    const entry = this.entries.get(key) ?? { activeUses: 0 };
    this.touch(key, entry);
    this.evict(textures);
  }

  markLoadFailed(key: string): void {
    const entry = this.entries.get(key);
    if (entry !== undefined && entry.activeUses === 0) this.entries.delete(key);
  }

  release(key: string, textures: ArtworkTextureStore): void {
    const entry = this.entries.get(key);
    if (entry === undefined) return;
    entry.activeUses = Math.max(0, entry.activeUses - 1);
    this.touch(key, entry);
    this.evict(textures);
  }

  private touch(key: string, entry: ArtworkTextureEntry): void {
    this.entries.delete(key);
    this.entries.set(key, entry);
  }

  private evict(textures: ArtworkTextureStore): void {
    for (const [key, entry] of this.entries) {
      if (entry.activeUses === 0 && !textures.exists(key)) this.entries.delete(key);
    }
    let loadedCount = [...this.entries.keys()].filter((key) => textures.exists(key)).length;
    if (loadedCount <= this.maxEntries) return;
    for (const [key, entry] of this.entries) {
      if (loadedCount <= this.maxEntries) break;
      if (entry.activeUses > 0 || !textures.exists(key)) continue;
      textures.remove(key);
      this.entries.delete(key);
      loadedCount -= 1;
    }
  }
}
