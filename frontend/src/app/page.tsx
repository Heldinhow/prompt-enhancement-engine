'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Copy, Check, Zap, Target, Layers, Brain, Wand2, FileText, Gauge, ChevronDown, ChevronUp } from 'lucide-react';

interface PromptScore {
  clarity: number;
  specificity: number;
  executability: number;
  ambiguity_control: number;
  structure: number;
  final_score: number;
}

interface PromptResponse {
  optimized_prompt: string;
  improvements_applied: string[];
  score: PromptScore;
  compact_version: string;
}

const MODES = [
  { value: 'general', label: 'Geral' },
  { value: 'coding', label: 'Código' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'produto', label: 'Produto' },
  { value: 'ia', label: 'IA' },
  { value: 'automacao', label: 'Automação' },
];

// Processing status messages for visual feedback
const STATUS_MESSAGES = [
  { key: 'Analyzing intent...', icon: Brain, color: 'text-blue-400' },
  { key: 'Calling MiniMax M2.5...', icon: Wand2, color: 'text-purple-400' },
  { key: 'Streaming response...', icon: FileText, color: 'text-amber-400' },
  { key: 'Using template fallback...', icon: FileText, color: 'text-gray-400' },
  { key: 'Generating template...', icon: FileText, color: 'text-gray-400' },
  { key: 'Calculating quality score...', icon: Gauge, color: 'text-green-400' },
];

// Placeholder examples
const PLACEHOLDER_EXAMPLES = [
  "Create a Python script that fetches data from an API and saves it to a CSV file",
  "Write a marketing email for a new eco-friendly product launch",
  "Design a database schema for a task management application",
  "Explain quantum computing to a 10-year-old",
];

export default function Home() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    score: true,
    improvements: true,
    optimized: true,
  });
  
  // Streaming state
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [statusIcon, setStatusIcon] = useState<typeof Brain>(Brain);
  const [statusColor, setStatusColor] = useState('text-blue-400');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  const streamingContentRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(Math.max(textarea.scrollHeight, 120), 400) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Auto-scroll streaming content
  useEffect(() => {
    if (streamingContentRef.current) {
      streamingContentRef.current.scrollTop = streamingContentRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        enhance();
      }
    }
  };

  const enhance = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    setStreamingContent('');
    setCurrentStatus('Initializing...');
    setShowTypingIndicator(true);
    setExpandedSections({ score: true, improvements: true, optimized: true });

    // Focus on result area
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const response = await fetch('/api/enhance/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode }),
      });

      if (!response.ok) throw new Error('Erro ao processar');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No response stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                setCurrentStatus(data.message);
                // Find matching status message for icon/color
                const statusInfo = STATUS_MESSAGES.find(s => data.message.includes(s.key.split('...')[0]));
                if (statusInfo) {
                  setStatusIcon(statusInfo.icon);
                  setStatusColor(statusInfo.color);
                }
              } else if (data.type === 'chunk') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setResult(data);
                setShowTypingIndicator(false);
              } else if (data.type === 'error') {
                setError(data.error || 'Unknown error');
                setShowTypingIndicator(false);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError('Falha ao processar. Tente novamente.');
      setShowTypingIndicator(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      // Try modern API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for mobile/HTTP
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(section);
      setTimeout(() => setCopied(null), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 6) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getScoreRing = (score: number) => {
    if (score >= 8) return 'ring-emerald-500/30';
    if (score >= 6) return 'ring-yellow-500/30';
    return 'ring-red-500/30';
  };

  // Determine if we're in streaming mode (content coming in but no final result yet)
  const isStreaming = loading && (streamingContent || currentStatus);
  const charCount = input.length;
  const maxChars = 4000;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-5 sm:mb-6 font-mono tracking-wider">
            <Sparkles className="w-3 h-3" />
            PROMPT ENHANCEMENT ENGINE
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight mb-3 sm:mb-4">
            Transform prompts into
            <br />
            <span className="text-purple-400">structured instructions</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto px-2">
            Optimize your prompts for AI agents with clarity, structure, and measurable quality.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-6 sm:mb-10">
          <div className={`relative transition-all duration-200 ${isFocused ? 'ring-2 ring-purple-500/40 rounded-lg' : ''}`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, maxChars))}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg p-4 pr-16 text-white placeholder-gray-500 focus:outline-none resize-none font-mono text-sm transition-all duration-200"
              style={{ minHeight: '120px', height: '120px' }}
              disabled={loading}
              aria-label="Enter your prompt to enhance"
            />
            
            {/* Character counter */}
            <div className="absolute bottom-3 right-4 text-xs font-mono text-gray-600">
              <span className={charCount > maxChars * 0.9 ? 'text-red-400' : ''}>
                {charCount}
              </span>
              <span className="text-gray-700">/{maxChars}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-4">
            {/* Mode selector with horizontal scroll on mobile */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  disabled={loading}
                  className={`px-3 py-2 sm:py-1.5 rounded text-xs font-mono transition-all duration-150 whitespace-nowrap min-h-[44px] flex items-center ${
                    mode === m.value
                      ? 'bg-white text-black'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            
            {/* Submit button - always visible */}
            <button
              onClick={enhance}
              disabled={loading || !input.trim()}
              className="px-8 py-3.5 sm:py-2.5 bg-white text-black rounded-lg text-sm font-semibold font-mono hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 min-h-[52px] sm:min-h-[44px] active:scale-[0.98] shadow-lg shadow-white/5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  PROCESSING
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  ENHANCE PROMPT
                </>
              )}
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-xs text-gray-600 mt-3 text-center sm:text-left">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-gray-400 font-mono text-[10px]">Enter</kbd> to submit • <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-gray-400 font-mono text-[10px]">Shift+Enter</kbd> for new line
          </p>
        </div>

        {/* Processing Status Indicator */}
        {loading && (
          <div className="mb-6 p-4 rounded-lg bg-zinc-900/80 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full bg-white/10 ${statusColor}`}>
                {loading && (
                  <div className="w-5 h-5">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="text-xs font-mono text-gray-500 mb-1">PROCESSING</div>
                <div className={`text-sm font-mono ${statusColor} flex items-center gap-2`}>
                  {showTypingIndicator && (
                    <span className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                  {currentStatus || 'Starting...'}
                </div>
              </div>
              
              <div className="hidden sm:block w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-400 transition-all duration-300 ease-out"
                  style={{ 
                    width: showTypingIndicator ? '60%' : '100%',
                    animation: showTypingIndicator ? 'pulse 1.5s ease-in-out infinite' : 'none'
                  }} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono animate-in fade-in slide-in-from-top-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Streaming Content Preview */}
        {isStreaming && streamingContent && (
          <div className="mb-6 border border-purple-500/20 rounded-xl overflow-hidden animate-in fade-in duration-300" id="result-section">
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-500/5">
              <span className="text-xs font-mono text-purple-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                STREAMING PREVIEW
              </span>
              <span className="text-xs font-mono text-gray-500">
                {streamingContent.length} chars
              </span>
            </div>
            <pre 
              ref={streamingContentRef}
              className="p-4 text-xs sm:text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar"
            >
              {streamingContent}
              <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse ml-0.5" />
            </pre>
          </div>
        )}

        {/* Final Result - Only Optimized Prompt */}
        {result && !loading && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" id="result-section">
            
            {/* Optimized Prompt Section - Only content shown */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900/50">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Optimized Prompt</span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.optimized_prompt, 'optimized')}
                  className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white min-h-[40px] px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {copied === 'optimized' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 sm:p-5 text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                {result.optimized_prompt}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-xs font-mono text-gray-700">
            POWERED BY MINIMAX M2.5 • STREAMING ENABLED
          </p>
        </div>
      </div>
    </div>
  );
}
