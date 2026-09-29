import { BORDERS, VISUAL_COLORS } from "./VisualTokens.js";

export type ButtonKind = "primary" | "secondary" | "tertiary";
export type ButtonState = "default" | "hover" | "pressed" | "disabled" | "focus";

export interface ButtonVisualPolicy {
  readonly fill: number;
  readonly fillAlpha: number;
  readonly label: string;
  readonly border: number;
  readonly borderWidth: number;
  readonly offsetY: number;
  readonly focusRing: boolean;
}

export const resolveButtonVisual = (kind: ButtonKind, state: ButtonState): ButtonVisualPolicy => {
  const c = VISUAL_COLORS;
  if (state === "disabled") return kind === "primary"
    ? { fill: c.primary.tealDisabled.phaser, fillAlpha: 1, label: c.disabledLabel.hex, border: c.primary.tealDisabled.phaser, borderWidth: 0, offsetY: 0, focusRing: false }
    : { fill: c.state.lockedFill.phaser, fillAlpha: 1, label: c.text.tertiary.hex, border: c.state.locked.phaser, borderWidth: BORDERS.structural, offsetY: 0, focusRing: false };

  if (kind === "primary") return {
    fill: state === "pressed" ? c.primary.tealPressed.phaser
      : state === "hover" ? c.primary.tealHover.phaser : c.primary.teal.phaser,
    fillAlpha: 1, label: c.white.hex, border: c.primary.tealPressed.phaser, borderWidth: 0,
    offsetY: state === "pressed" ? 2 : state === "hover" ? -1 : 0, focusRing: state === "focus",
  };
  if (kind === "secondary") return {
    fill: state === "pressed" ? c.secondaryPressed.phaser : state === "hover" ? c.state.selectedFill.phaser : c.surface.card.phaser,
    fillAlpha: 1, label: c.text.primary.hex, border: c.border.strong.phaser, borderWidth: BORDERS.structural,
    offsetY: state === "pressed" ? 2 : state === "hover" ? -1 : 0, focusRing: state === "focus",
  };
  return {
    fill: state === "pressed" ? c.state.selectedFill.phaser : c.surface.card.phaser,
    fillAlpha: state === "default" || state === "focus" ? 0 : 1, label: c.text.primary.hex,
    border: c.border.strong.phaser, borderWidth: 0, offsetY: state === "pressed" ? 1 : 0,
    focusRing: state === "focus",
  };
};
