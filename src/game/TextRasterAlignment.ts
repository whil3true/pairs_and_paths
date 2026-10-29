import {
  alignTextQuadInPlace, hasNativePhysicalCanvas, isNativeTextQuad, TEXT_QUAD_EPSILON,
} from "./TextRasterAlignmentPolicy.js";

interface CanvasAlignmentState {
  readonly game: Phaser.Game;
  dirty: boolean;
  eligible: boolean;
  backingWidth: number;
  backingHeight: number;
  devicePixelRatio: number;
}

interface ImageTexturerNode extends Phaser.Renderer.WebGL.RenderNodes.RenderNode {
  readonly frame: Phaser.Textures.Frame;
}

const canvasStates = new WeakMap<Phaser.Game, CanvasAlignmentState>();
const transformerNodes = new WeakMap<
  Phaser.Renderer.WebGL.RenderNodes.RenderNodeManager,
  Phaser.Renderer.WebGL.RenderNodes.RenderNode
>();

const approximatelyEqual = (left: number, right: number): boolean =>
  Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= TEXT_QUAD_EPSILON;

const getDevicePixelRatio = (): number =>
  typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

const getCanvasState = (game: Phaser.Game): CanvasAlignmentState => {
  const existing = canvasStates.get(game);
  if (existing !== undefined) return existing;

  const state: CanvasAlignmentState = {
    game,
    dirty: true,
    eligible: false,
    backingWidth: 0,
    backingHeight: 0,
    devicePixelRatio: 0,
  };
  const markDirty = (): void => { state.dirty = true; };
  game.scale.on(Phaser.Scale.Events.RESIZE, markDirty);
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    game.scale.off(Phaser.Scale.Events.RESIZE, markDirty);
    canvasStates.delete(game);
  });
  canvasStates.set(game, state);
  return state;
};

const hasEligibleCanvas = (state: CanvasAlignmentState): boolean => {
  const { game } = state;
  const canvas = game.canvas;
  const dpr = getDevicePixelRatio();
  if (canvas.width !== state.backingWidth || canvas.height !== state.backingHeight ||
      dpr !== state.devicePixelRatio) state.dirty = true;
  if (!state.dirty) return state.eligible;

  state.dirty = false;
  state.backingWidth = canvas.width;
  state.backingHeight = canvas.height;
  state.devicePixelRatio = dpr;
  const bounds = canvas.getBoundingClientRect();
  state.eligible = game.device.os.desktop && hasNativePhysicalCanvas(
    canvas.width, canvas.height, bounds.width, bounds.height, bounds.left, bounds.top, dpr,
  );
  return state.eligible;
};

const hasActiveCameraTransform = (camera: Phaser.Cameras.Scene2D.Camera): boolean =>
  camera.shakeEffect.isRunning || camera.panEffect.isRunning || camera.rotateToEffect.isRunning
  || camera.zoomEffect.isRunning;

const hasSupportedTransforms = (
  text: Phaser.GameObjects.Text,
  camera: Phaser.Cameras.Scene2D.Camera,
  renderScale: number,
): boolean => {
  // Phaser 4.2.1 exposes Camera.rotation at runtime but omits it from the
  // generated Camera declaration, so keep the compatibility cast local.
  const cameraRotation = (camera as Phaser.Cameras.Scene2D.Camera & { readonly rotation: number }).rotation;
  if (text.isCropped || text.flipX || text.flipY || text.mask !== null || text.filters !== null ||
      !approximatelyEqual(text.rotation, 0) || !approximatelyEqual(text.scaleX, 1) ||
      !approximatelyEqual(text.scaleY, 1) || text.scene.tweens.isTweening(text) ||
      camera.roundPixels || !approximatelyEqual(cameraRotation, 0) ||
      !approximatelyEqual(camera.zoomX, renderScale) || !approximatelyEqual(camera.zoomY, renderScale) ||
      hasActiveCameraTransform(camera)) return false;

  let parent = text.parentContainer;
  while (parent !== null) {
    if (parent.mask !== null || parent.filters !== null || !approximatelyEqual(parent.rotation, 0) ||
        !approximatelyEqual(parent.scaleX, 1) || !approximatelyEqual(parent.scaleY, 1) ||
        text.scene.tweens.isTweening(parent)) return false;
    parent = parent.parentContainer;
  }
  return true;
};

const getTransformerNode = (
  renderer: Phaser.Renderer.WebGL.WebGLRenderer,
  state: CanvasAlignmentState,
): Phaser.Renderer.WebGL.RenderNodes.RenderNode => {
  const manager = renderer.renderNodes;
  const existing = transformerNodes.get(manager);
  if (existing !== undefined) return existing;

  // Phaser's built-in TransformerImage is intentionally manager-shared and
  // consumed synchronously by SubmitterQuad. This game-local instance follows
  // that supported pattern without changing the global or built-in node.
  class NativeTextTransformer extends Phaser.Renderer.WebGL.RenderNodes.TransformerImage {
    override run(
      drawingContext: Phaser.Renderer.WebGL.DrawingContext,
      gameObject: Phaser.GameObjects.GameObject,
      texturerNode: Phaser.Renderer.WebGL.RenderNodes.RenderNode,
      parentMatrix?: Phaser.GameObjects.Components.TransformMatrix,
      element?: object,
    ): void {
      super.run(drawingContext, gameObject, texturerNode, parentMatrix, element);
      if (!(gameObject instanceof Phaser.GameObjects.Text)) return;
      const text = gameObject;
      const renderScale = text.style.resolution;
      const camera = drawingContext.camera;
      if (camera === null || !(renderScale > 1 && renderScale < 2) || !hasEligibleCanvas(state) ||
          !hasSupportedTransforms(text, camera, renderScale)) return;

      const texturer = texturerNode as ImageTexturerNode;
      if (texturer.frame !== text.frame || !isNativeTextQuad(
        this.quad, text.frame.cutWidth, text.frame.cutHeight,
      )) return;

      const width = text.canvas.width;
      const height = text.canvas.height;
      if (width <= 0 || height <= 0) return;
      alignTextQuadInPlace(this.quad, width, height);
    }
  }

  const node = new NativeTextTransformer(manager, { name: "NativeTextTransformer" });
  transformerNodes.set(manager, node);
  return node;
};

/**
 * Opts one Text object into the conservative desktop-only WebGL correction.
 * Unsupported and transient states continue through Phaser's original
 * TransformerImage result on that same render without modifying Text state.
 */
export const attachTextRasterAlignment = <T extends Phaser.GameObjects.Text>(
  text: T,
  renderScale: number,
): T => {
  if (!(renderScale > 1 && renderScale < 2) || text.scene.game.renderer.type !== Phaser.WEBGL) return text;
  const renderer = text.scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  const node = getTransformerNode(renderer, getCanvasState(text.scene.game));
  text.setRenderNodeRole("Transformer", node);
  return text;
};

