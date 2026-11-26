import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { memoryCoverScale, constrainMemoryCrop, memoryCropSource } from '../../utils/memoryCrop';

export interface MemoryImageEditorHandle { exportImage: () => Promise<File> }
type Crop = { zoom: number; x: number; y: number };
const initial: Crop = { zoom: 1, x: 0, y: 0 };

// Coordinates use a fixed logical frame, independent of screen size and pixel density.
export const MemoryImageEditor = forwardRef<MemoryImageEditorHandle, {
  mode?: 'space' | 'avatar'; src: string; disabled: boolean; onReady: (ready: boolean) => void;
}>(function MemoryImageEditor({ src, disabled, onReady, mode = 'space' }, ref) {
  const frameHeight = mode === 'avatar' ? 400 : 300;
  const image = useRef<HTMLImageElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>(initial);
  const base = size.width ? memoryCoverScale(size.width, size.height, frameHeight) : 1;
  const constrain = (next: Crop) => constrainMemoryCrop(size.width, size.height, next, frameHeight);
  useImperativeHandle(ref, () => ({
    async exportImage() {
      if (!image.current || !size.width) throw new Error('Ảnh chưa sẵn sàng. Vui lòng thử lại.');
      const source = memoryCropSource(size.width, size.height, crop, frameHeight);
      const sourceWidth = source.width;
      const sourceHeight = source.height;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(4, Math.floor(Math.min(1600, sourceWidth) / 4) * 4);
      canvas.height = canvas.width * frameHeight / 400;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Thiết bị không hỗ trợ xử lý ảnh.');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingQuality = 'high';
      context.drawImage(image.current,
        source.x, source.y,
        sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        value => value ? resolve(value) : reject(new Error('Không thể xuất ảnh. Vui lòng thử lại.')), 'image/jpeg', 0.92));
      if (blob.size > 5 * 1024 * 1024) throw new Error('Ảnh sau khi xử lý vượt giới hạn 5MB của máy chủ. Vui lòng chọn ảnh khác.');
      return new File([blob], `lovera-${mode === 'avatar' ? 'avatar' : 'memory'}-${Date.now()}.jpg`, { type: 'image/jpeg' });
    },
  }));
  const point = (event: React.PointerEvent) => {
    const rect = frame.current!.getBoundingClientRect();
    return { x: (event.clientX - rect.left - rect.width / 2) * 400 / rect.width,
      y: (event.clientY - rect.top - rect.height / 2) * frameHeight / rect.height };
  };
  const endPointer = (event: React.PointerEvent) => { pointers.current.delete(event.pointerId); };
  return <div className="space-y-2">
    <div ref={frame} style={{ aspectRatio: `400 / ${frameHeight}` }} className="relative w-full overflow-hidden rounded-2xl bg-rose-50 touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={event => {
        if (disabled || !size.width || (event.pointerType === 'mouse' && event.button !== 0)) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, point(event));
      }}
      onPointerMove={event => {
        if (disabled || !pointers.current.has(event.pointerId)) return;
        const previous = [...pointers.current.values()];
        const before = pointers.current.get(event.pointerId)!;
        const after = point(event);
        pointers.current.set(event.pointerId, after);
        if (pointers.current.size === 2) {
          const next = [...pointers.current.values()];
          const distance = (p: typeof next) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
          const oldDistance = distance(previous);
          if (oldDistance < 1) return;
          const oldCenter = { x: (previous[0].x + previous[1].x) / 2, y: (previous[0].y + previous[1].y) / 2 };
          const center = { x: (next[0].x + next[1].x) / 2, y: (next[0].y + next[1].y) / 2 };
          setCrop(current => {
            const zoom = Math.max(1, Math.min(4, current.zoom * distance(next) / oldDistance));
            const ratio = zoom / current.zoom;
            return constrain({ zoom, x: center.x - (oldCenter.x - current.x) * ratio, y: center.y - (oldCenter.y - current.y) * ratio });
          });
        } else if (pointers.current.size === 1) {
          setCrop(current => constrain({ ...current, x: current.x + after.x - before.x, y: current.y + after.y - before.y }));
        }
      }} onPointerUp={endPointer} onPointerCancel={endPointer} onLostPointerCapture={endPointer}>
      <img ref={image} src={src} alt={mode === 'avatar' ? 'Ảnh đại diện đang căn chỉnh' : 'Ảnh kỷ niệm đang căn chỉnh'} draggable={false}
        onLoad={event => { setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }); onReady(true); }}
        onError={() => onReady(false)}
        className="absolute max-w-none pointer-events-none"
        style={{ left: `${50 + crop.x / 4}%`, top: `${50 + crop.y * 100 / frameHeight}%`, width: `${size.width * base * crop.zoom / 4}%`, height: `${size.height * base * crop.zoom * 100 / frameHeight}%`, transform: 'translate(-50%, -50%)' }} />
      {mode === 'avatar' && <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90" style={{ boxShadow: '0 0 0 200px rgb(28 25 23 / 60%)' }} />}
    </div>
    <p className="text-[11px] leading-relaxed text-stone-500">Kéo ảnh để căn chỉnh • Chụm hai ngón để thu phóng</p>
    <div className="rounded-xl bg-rose-50/60 px-3 pt-2">
      <label className="block text-stone-600">
        <span className="flex items-center justify-between gap-2">
          <span>Thu phóng</span>
          <span className="font-semibold tabular-nums text-rose-700">{Math.round(crop.zoom * 100)}%</span>
        </span>
        <input aria-label="Thu phóng ảnh" aria-valuetext={`${Math.round(crop.zoom * 100)}%`} type="range" min="1" max="4" step="0.01" value={crop.zoom} disabled={disabled} className="block h-11 w-full min-w-0 cursor-pointer accent-rose-500 disabled:opacity-50" onChange={event => setCrop(current => constrain({ ...current, zoom: Number(event.target.value) }))} />
      </label>
    </div>
    <div className="flex gap-2">
      <button type="button" disabled={disabled} className="flex-1 min-h-11 rounded-xl bg-rose-50 text-rose-700 font-semibold" onClick={() => setCrop(current => ({ ...current, x: 0, y: 0 }))}>Căn giữa ảnh</button>
      <button type="button" disabled={disabled} className="flex-1 min-h-11 rounded-xl bg-stone-100 font-semibold" onClick={() => setCrop(initial)}>Đặt lại</button>
    </div>
  </div>;
});
