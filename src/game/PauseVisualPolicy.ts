export const PAUSE_LAYOUT = Object.freeze({
  panel: Object.freeze({ centerX: 240, centerY: 400, width: 416, height: 360 }),
  title: Object.freeze({ centerX: 240, centerY: 278 }),
  body: Object.freeze({ centerX: 240, centerY: 330 }),
  button: Object.freeze({ centerX: 240, width: 368, height: 52, gap: 12 }),
  pauseButtonCenters: Object.freeze([360, 424, 488] as const),
  confirmationButtonCenters: Object.freeze({ safe: 420, danger: 484 }),
  // Only the ordinary Pause view grows; existing confirmations stay compact.
  audioPanel: Object.freeze({ centerX: 240, centerY: 400, width: 416, height: 520 }),
  audioTitleY: 203,
  audioSliderCenters: Object.freeze([278, 358] as const),
  audioButtonCenters: Object.freeze([454, 520, 586] as const),
});

