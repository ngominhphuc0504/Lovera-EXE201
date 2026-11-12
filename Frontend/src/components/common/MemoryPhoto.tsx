import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { memoryService } from '../../services/memoryService';

export interface MemoryPhotoProps {
  memoryId: string;
  imageUrl: string;
  alt: string;
  className: string;
  isBackendMode: boolean;
  loading?: 'lazy' | 'eager';
}

// Global in-memory cache for authenticated blob URLs so photos don't re-fetch or flicker on polling
const memoryBlobUrlCache = new Map<string, string>();

export const MemoryPhoto: React.FC<MemoryPhotoProps> = ({
  memoryId,
  imageUrl,
  alt,
  className,
  isBackendMode,
  loading = 'lazy',
}) => {
  const needsAuth = Boolean(
    isBackendMode &&
    imageUrl &&
    imageUrl.includes('/memories/') &&
    !imageUrl.startsWith('data:') &&
    !imageUrl.startsWith('blob:')
  );

  const [protectedImageUrl, setProtectedImageUrl] = useState<string>(() => {
    if (needsAuth && memoryBlobUrlCache.has(memoryId)) {
      return memoryBlobUrlCache.get(memoryId)!;
    }
    return '';
  });
  const [imageError, setImageError] = useState('');
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!needsAuth) return;

    // If already in cache, ensure state has it and don't re-fetch
    if (memoryBlobUrlCache.has(memoryId)) {
      const cached = memoryBlobUrlCache.get(memoryId)!;
      if (protectedImageUrl !== cached) {
        setProtectedImageUrl(cached);
      }
      return;
    }

    let active = true;

    const loadImage = () => {
      void memoryService.getImage(memoryId)
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          memoryBlobUrlCache.set(memoryId, objectUrl);
          if (active) setProtectedImageUrl(objectUrl);
        })
        .catch(error => {
          if (active) {
            setImageError(error instanceof Error ? error.message : 'Không tải được ảnh.');
          }
        });
    };

    let observer: IntersectionObserver | undefined;
    if (loading === 'eager' || typeof IntersectionObserver === 'undefined') {
      loadImage();
    } else {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer?.disconnect();
          loadImage();
        }
      });
      if (imageContainerRef.current) observer.observe(imageContainerRef.current);
    }

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [imageUrl, isBackendMode, loading, memoryId, needsAuth]);

  if (!imageUrl || (needsAuth && imageError)) {
    return (
      <div className="w-full h-full min-h-16 flex flex-col items-center justify-center gap-1 bg-stone-100 text-stone-400">
        <ImageIcon className="w-5 h-5 text-stone-300" />
        {imageError && <span className="px-1 text-center text-[9px] text-stone-400 truncate max-w-full">{imageError}</span>}
      </div>
    );
  }

  if (needsAuth && !protectedImageUrl) {
    return (
      <div ref={imageContainerRef} className="w-full h-full min-h-16 flex items-center justify-center bg-stone-100 text-stone-400">
        <ImageIcon className="w-5 h-5 text-stone-300 animate-pulse" />
      </div>
    );
  }

  const image = (
    <img
      src={needsAuth ? protectedImageUrl : imageUrl}
      alt={alt}
      className={className}
      loading={loading}
    />
  );

  return needsAuth
    ? <div ref={imageContainerRef} className="w-full h-full">{image}</div>
    : image;
};
