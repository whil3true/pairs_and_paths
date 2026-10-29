/** Maximum physical-pixel error accepted for browser CSS layout quantization. */
export const PHYSICAL_CANVAS_EPSILON = 0.125;

/** Tighter tolerance for the already-computed WebGL quad geometry. */
export const TEXT_QUAD_EPSILON = 0.001;

const approximatelyEqual = (left: number, right: number, epsilon: number): boolean =>
  Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= epsilon;

const alignedToInteger = (value: number, epsilon: number): boolean =>
  approximatelyEqual(value, Math.round(value), epsilon);

/**
 * Confirms that one backing pixel maps to one physical display pixel and that
 * the canvas begins on the physical pixel grid. Browser layout positions are
 * quantized in CSS pixels, hence the small explicit tolerance.
 */
export const hasNativePhysicalCanvas = (
  backingWidth: number,
  backingHeight: number,
  displayWidth: number,
  displayHeight: number,
  displayLeft: number,
  displayTop: number,
  devicePixelRatio: number,
): boolean => {
  if (![backingWidth, backingHeight, displayWidth, displayHeight, displayLeft, displayTop, devicePixelRatio]
    .every(Number.isFinite) || backingWidth <= 0 || backingHeight <= 0 ||
      displayWidth <= 0 || displayHeight <= 0 || devicePixelRatio <= 0) return false;

  return approximatelyEqual(backingWidth, displayWidth * devicePixelRatio, PHYSICAL_CANVAS_EPSILON)
    && approximatelyEqual(backingHeight, displayHeight * devicePixelRatio, PHYSICAL_CANVAS_EPSILON)
    && alignedToInteger(displayLeft * devicePixelRatio, PHYSICAL_CANVAS_EPSILON)
    && alignedToInteger(displayTop * devicePixelRatio, PHYSICAL_CANVAS_EPSILON);
};

/**
 * Phaser's image quad order is top-left, bottom-left, bottom-right, top-right.
 * This gate admits only an unrotated, unskewed, positively oriented quad whose
 * effective dimensions still match Phaser's Text frame metadata.
 */
export const isNativeTextQuad = (
  quad: ArrayLike<number>,
  expectedWidth: number,
  expectedHeight: number,
): boolean => {
  if (quad.length < 8 || !Number.isFinite(expectedWidth) || !Number.isFinite(expectedHeight)
    || expectedWidth <= 0 || expectedHeight <= 0) return false;
  for (let index = 0; index < 8; index += 1) {
    if (!Number.isFinite(quad[index])) return false;
  }

  const width = quad[6]! - quad[0]!;
  const height = quad[3]! - quad[1]!;
  return width > 0 && height > 0
    && approximatelyEqual(quad[0]!, quad[2]!, TEXT_QUAD_EPSILON)
    && approximatelyEqual(quad[1]!, quad[7]!, TEXT_QUAD_EPSILON)
    && approximatelyEqual(quad[4]!, quad[6]!, TEXT_QUAD_EPSILON)
    && approximatelyEqual(quad[3]!, quad[5]!, TEXT_QUAD_EPSILON)
    && approximatelyEqual(width, expectedWidth, TEXT_QUAD_EPSILON)
    && approximatelyEqual(height, expectedHeight, TEXT_QUAD_EPSILON);
};

/**
 * Snaps only the top-left corner, then reconstructs every other corner from
 * the real integer texture dimensions. This avoids independently rounding the
 * four corners and accidentally stretching a texture by one pixel.
 */
export const alignTextQuadInPlace = (
  quad: Float32Array,
  physicalTextureWidth: number,
  physicalTextureHeight: number,
): void => {
  const left = Math.round(quad[0]!);
  const top = Math.round(quad[1]!);
  const right = left + physicalTextureWidth;
  const bottom = top + physicalTextureHeight;
  quad[0] = left;
  quad[1] = top;
  quad[2] = left;
  quad[3] = bottom;
  quad[4] = right;
  quad[5] = bottom;
  quad[6] = right;
  quad[7] = top;
};

