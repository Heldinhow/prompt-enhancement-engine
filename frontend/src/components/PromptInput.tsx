'use client';

import { useRef, useCallback, useState, KeyboardEvent } from 'react';
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

const MIN_HEIGHT = 140;
const MAX_HEIGHT = 280;

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

  useAutoResizeTextarea(textareaRef, value, {
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (!disabled && !loading && value.trim()) {
          onSubmit();
        }
      }
    },
    [disabled, loading, value, onSubmit]
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
      return placeholderExamples[0];
    }
    return 'Describe what you want AI to do...';
  };

  const getCharCounterColor = () => {
    const percentage = (charCount / maxChars) * 100;
    if (percentage >= 95) return 'text-red-400';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-gray-600';
  };

  return (
    <div
      className={`
        w-full max-w-3xl mx-auto
        relative
        bg-white/[0.03]
        border rounded-2xl
        transition-all duration-200 ease-out
        ${disabled || loading ? 'opacity-50' : ''}
        ${
          isFocused
            ? 'border-white/20 ring-1 ring-white/10'
            : 'border-white/5'
        }
      `}
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
        rows={4}
      />

      <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-white/5">
        <span className={`text-xs font-mono ${getCharCounterColor()}`}>
          {charCount.toLocaleString()} / {maxChars.toLocaleString()}
        </span>

        <button
          onClick={onSubmit}
          disabled={disabled || loading || !value.trim()}
          className={`
            flex items-center justify-center
            h-9 px-4
            bg-white text-black
            rounded-lg
            font-medium text-sm
            transition-all duration-150
            hover:bg-gray-200
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white
            ${loading ? 'bg-gray-100' : ''}
          `}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
