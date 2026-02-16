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
      const scrollHeight = textarea.scrollHeight;
      
      if (scrollHeight <= minHeight) {
        textarea.style.height = `${minHeight}px`;
        textarea.style.overflowY = 'hidden';
      } else if (scrollHeight >= maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    };

    resize();
  }, [value, minHeight, maxHeight, ref]);
}
