const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

const parseHexColor = (hex: string): readonly [number, number, number] => {
  if (!HEX_COLOR_PATTERN.test(hex)) throw new RangeError(`Invalid hex color: ${hex}`);
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
};

export const blendHexColors = (baseHex: string, overlayHex: string, alpha: number): string => {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new RangeError(`Alpha must be between 0 and 1: ${alpha}`);
  }
  const base = parseHexColor(baseHex);
  const overlay = parseHexColor(overlayHex);
  const channels = base.map((channel, index) =>
    Math.round(overlay[index]! * alpha + channel * (1 - alpha)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
};

export const setPageBackdrop = (background: string, transitionDuration: number): void => {
  if (typeof document === "undefined") return;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--page-background-transition", `${transitionDuration}ms`);
  rootStyle.setProperty("--page-background", background);
};

export const resetPageBackdrop = (background: string): void => {
  setPageBackdrop(background, 0);
};
