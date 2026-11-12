export interface MemoryCrop { zoom: number; x: number; y: number }
export function memoryCoverScale(width: number, height: number) {
  return Math.max(400 / width, 300 / height);
}
export function constrainMemoryCrop(width: number, height: number, crop: MemoryCrop): MemoryCrop {
  const zoom = Math.max(1, Math.min(4, crop.zoom));
  const scale = memoryCoverScale(width, height) * zoom;
  const maxX = Math.max(0, (width * scale - 400) / 2);
  const maxY = Math.max(0, (height * scale - 300) / 2);
  return { zoom, x: Math.max(-maxX, Math.min(maxX, crop.x)), y: Math.max(-maxY, Math.min(maxY, crop.y)) };
}
export function memoryCropSource(width: number, height: number, crop: MemoryCrop) {
  const scale = memoryCoverScale(width, height) * crop.zoom;
  const sourceWidth = 400 / scale;
  const sourceHeight = 300 / scale;
  return { x: (width - sourceWidth) / 2 - crop.x / scale,
    y: (height - sourceHeight) / 2 - crop.y / scale, width: sourceWidth, height: sourceHeight };
}
