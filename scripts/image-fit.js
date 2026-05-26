import { clampNumber } from "./utils.js";

export function normalizeImageFit(fit = {}) {
  fit = fit ?? {};
  return {
    x: clampNumber(fit.x, 0, 100, 50),
    y: clampNumber(fit.y, 0, 100, 50),
    zoom: clampNumber(fit.zoom, 1, 3, 1),
    flip: Boolean(fit.flip)
  };
}

export function getImageFitStyle(fit, flip = 1) {
  return Object.entries(getImageFitCssVars(fit, flip))
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
}

export function getImageFitCssVars(fit, flip = 1) {
  const normalized = normalizeImageFit(fit);
  const zoomPanFactor = (normalized.zoom - 1) / normalized.zoom;
  const panX = (50 - normalized.x) * zoomPanFactor;
  const panY = (50 - normalized.y) * zoomPanFactor;

  return {
    "--fighter-image-x": `${normalized.x}%`,
    "--fighter-image-y": `${normalized.y}%`,
    "--fighter-image-pan-x": `${panX}%`,
    "--fighter-image-pan-y": `${panY}%`,
    "--fighter-image-zoom": String(normalized.zoom),
    "--fighter-image-flip": String(flip)
  };
}
