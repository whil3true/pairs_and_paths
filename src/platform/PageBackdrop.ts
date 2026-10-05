export const setPageDim = (alpha: number, transitionDuration: number): void => {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new RangeError(`Alpha must be between 0 and 1: ${alpha}`);
  }
  if (!Number.isFinite(transitionDuration) || transitionDuration < 0) {
    throw new RangeError(`Transition duration must be non-negative: ${transitionDuration}`);
  }
  if (typeof document === "undefined") return;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--page-dim-transition", `${transitionDuration}ms`);
  rootStyle.setProperty("--page-dim-opacity", alpha.toString());
};

export const resetPageDim = (): void => {
  setPageDim(0, 0);
};
