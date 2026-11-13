import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { MemoryImageEditor, MemoryImageEditorHandle } from './MemoryImageEditor';
import { blobToDataUrl } from '../../utils/userDirectory';
import { playSound } from '../../utils/audio';

// Keep selection local until the user explicitly saves the exported crop.
export const AvatarUpload = forwardRef<HTMLInputElement, {
  onSave?: (preview: string, file: File) => Promise<void>;
}>(function AvatarUpload({ onSave }, ref) {
  const [source, setSource] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const busy = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<MemoryImageEditorHandle>(null);
  const titleId = React.useId();

  useEffect(() => {
    if (!source) return;
    dialog.current?.showModal();
    return () => { URL.revokeObjectURL(source); };
  }, [source]);

  const close = () => {
    if (busy.current) return;
    dialog.current?.close();
    setSource('');
    setReady(false);
  };

  const save = async () => {
    if (busy.current || !ready || !onSave || !editor.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const file = await editor.current.exportImage();
      const preview = await blobToDataUrl(file);
      await onSave(preview, file);
      busy.current = false;
      close();
      setNotice('Đã lưu ảnh đại diện.');
      playSound('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu ảnh đại diện. Vui lòng thử lại.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return <>
    <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={saving || !onSave}
      onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setNotice('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
          setNotice('Vui lòng chọn ảnh PNG, JPEG hoặc WebP tối đa 15MB.');
          return;
        }
        setReady(false);
        setError('');
        setSource(URL.createObjectURL(file));
      }} />
    {notice && <div className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-stone-800 p-3 text-center text-sm text-white" role="status" onClick={() => setNotice('')}>{notice}</div>}
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-3xl bg-white p-4 text-sm text-stone-800 shadow-xl backdrop:bg-stone-900/60">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={titleId} className="font-bold">Chỉnh sửa ảnh đại diện</h2>
        <button type="button" disabled={saving} onClick={close} className="min-h-11 px-2 text-stone-500">Hủy</button>
      </div>
      {source && <MemoryImageEditor key={source} ref={editor} src={source} mode="avatar" disabled={saving}
        onReady={value => { setReady(value); if (!value) setError('Không thể đọc ảnh. Vui lòng chọn ảnh khác.'); }} />}
      {error && <p role="alert" className="mt-3 text-rose-700">{error}</p>}
      <button type="button" disabled={!ready || saving || !onSave} onClick={() => void save()}
        className="mt-4 min-h-11 w-full rounded-xl bg-rose-500 px-3 font-semibold text-white disabled:opacity-50">
        {saving ? 'Đang lưu…' : 'Lưu ảnh đại diện'}
      </button>
    </dialog>
  </>;
});
