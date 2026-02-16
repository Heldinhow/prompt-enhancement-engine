'use client';

import { useEffect, RefObject } from 'react';

interface UseAutoResizeOptions {
  minHeight: number;
  maxHeight: number;
}

export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  options: UseAutoResizeOptions
): void {
  const { minHeight, maxHeight } = options;

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    const resize = () => {
      textarea.style.height = 'auto';
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight)
      );
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    resize();
  }, [value, minHeight, maxHeight, ref]);
}
