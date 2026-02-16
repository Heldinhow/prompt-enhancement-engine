'use client';

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled?: boolean;
  maxChars?: number;
  placeholderExamples?: string[];
}

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 240;

export function PromptInput({
  value,
  onChange,
  onSubmit,
  loading,
  disabled = false,
  maxChars = 4000,
  placeholderExamples,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useAutoResizeTextarea(textareaRef, value, {
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (isMobile) return;
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && !loading && value.trim()) {
          onSubmit();
        }
      }
    },
    [isMobile, disabled, loading, value, onSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      if (text.length <= maxChars) {
        onChange(text);
      }
    },
    [onChange, maxChars]
  );

  const charCount = value.length;
  
  const getPlaceholder = () => {
    if (placeholderExamples && placeholderExamples.length > 0) {
      return isMobile 
        ? placeholderExamples[0] 
        : placeholderExamples.join('\n');
    }
    return isMobile 
      ? 'Describe what you want...' 
      : 'Create a SaaS landing page...\nGenerate a growth strategy...\nWrite a Python automation script...';
  };

  const getCharCounterColor = () => {
    const percentage = (charCount / maxChars) * 100;
    if (percentage >= 95) return 'text-red-400';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-gray-500';
  };

  return (
    <div
      className={`
        w-full max-w-3xl mx-auto
        relative
        bg-zinc-900/80
        border rounded-2xl
        transition-all duration-200 ease-out
        backdrop-blur-sm
        ${disabled || loading ? 'opacity-60' : ''}
        ${
          isFocused
            ? 'border-purple-500 ring-2 ring-purple-500/20'
            : 'border-white/10 hover:border-white/20'
        }
      `}
      style={{
        paddingBottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : undefined,
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={getPlaceholder()}
        disabled={disabled || loading}
        className={`
          w-full
          bg-transparent
          px-5 py-4
          text-base text-white
          placeholder-gray-600
          resize-none
          focus:outline-none
          leading-relaxed
          font-sans
          scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent
          ${disabled ? 'cursor-not-allowed' : 'cursor-text'}
        `}
        style={{ minHeight: MIN_HEIGHT }}
        rows={3}
      />

      <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          {!isMobile && !loading && !disabled && (
            <span className="text-xs text-gray-600 font-mono hidden sm:block">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">Enter</kbd>
              <span className="mx-1.5 text-gray-700">to send</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">Shift</kbd>
              <span className="mx-1.5 text-gray-700">+</span>
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500">Enter</kbd>
              <span className="ml-1.5 text-gray-700">new line</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono ${getCharCounterColor()} hidden sm:block`}>
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}
          </span>

          <button
            onClick={onSubmit}
            disabled={disabled || loading || !value.trim()}
            className={`
              flex items-center justify-center
              min-h-[44px] min-w-[44px] px-4
              bg-white text-black
              rounded-xl
              font-mono text-sm font-medium
              transition-all duration-150
              hover:bg-gray-200
              active:scale-[0.98]
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
              ${loading ? 'bg-gray-100' : ''}
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span className="hidden sm:inline">Processing</span>
              </div>
            ) : (
              <>
                <span className="hidden sm:inline mr-2">Send</span>
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
