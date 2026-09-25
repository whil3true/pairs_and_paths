export type PlatformId = "web" | "yandex";

export interface PlatformService {
  readonly id: PlatformId;
  readonly displayName: string;
  readonly locale: string;
}
