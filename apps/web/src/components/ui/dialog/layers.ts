const NestedDialogZIndexStep = 20;

export const DialogOverlayZIndex = 80;

export const DialogContentZIndex = 81;

export const PopoverZIndex = 90;

export const layerZIndex = (baseZIndex: number, dialogDepth: number): number =>
  baseZIndex + dialogDepth * NestedDialogZIndexStep;
