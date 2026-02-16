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
      textarea.style.overflowY = 'hidden';
      
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight)
      );
      textarea.style.height = `${newHeight}px`;
      
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      }
    };

    resize();
  }, [value, minHeight, maxHeight, ref]);
}
