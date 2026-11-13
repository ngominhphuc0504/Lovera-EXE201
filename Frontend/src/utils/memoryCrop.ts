export interface MemoryCrop { zoom: number; x: number; y: number }
export function memoryCoverScale(width: number, height: number, frameHeight = 300) {
  return Math.max(400 / width, frameHeight / height);
}
export function constrainMemoryCrop(width: number, height: number, crop: MemoryCrop, frameHeight = 300): MemoryCrop {
  const zoom = Math.max(1, Math.min(4, crop.zoom));
  const scale = memoryCoverScale(width, height, frameHeight) * zoom;
  const maxX = Math.max(0, (width * scale - 400) / 2);
  const maxY = Math.max(0, (height * scale - frameHeight) / 2);
  return { zoom, x: Math.max(-maxX, Math.min(maxX, crop.x)), y: Math.max(-maxY, Math.min(maxY, crop.y)) };
}
export function memoryCropSource(width: number, height: number, crop: MemoryCrop, frameHeight = 300) {
  const scale = memoryCoverScale(width, height, frameHeight) * crop.zoom;
  const sourceWidth = 400 / scale;
  const sourceHeight = frameHeight / scale;
  return { x: (width - sourceWidth) / 2 - crop.x / scale,
    y: (height - sourceHeight) / 2 - crop.y / scale, width: sourceWidth, height: sourceHeight };
}
