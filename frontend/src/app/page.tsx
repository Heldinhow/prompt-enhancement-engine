'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Copy, Check, Target, Brain, Wand2, FileText, Gauge } from 'lucide-react';
import { PromptInput } from '@/components/PromptInput';

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

const STATUS_MESSAGES = [
  { key: 'Analyzing intent...', icon: Brain, color: 'text-blue-400' },
  { key: 'Calling MiniMax M2.5...', icon: Wand2, color: 'text-purple-400' },
  { key: 'Streaming response...', icon: FileText, color: 'text-amber-400' },
  { key: 'Using template fallback...', icon: FileText, color: 'text-gray-400' },
  { key: 'Generating template...', icon: FileText, color: 'text-gray-400' },
  { key: 'Calculating quality score...', icon: Gauge, color: 'text-green-400' },
];

const PLACEHOLDER_EXAMPLES = [
  "Create a Python script that fetches data from an API and saves it to a CSV file",
  "Write a marketing email for a new eco-friendly product launch",
  "Design a database schema for a task management application",
  "Explain quantum computing to a 10-year-old",
];

export default function Home() {
  const [input, setInput] = useState('');
  const [mode] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [statusColor, setStatusColor] = useState('text-blue-400');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  const streamingContentRef = useRef<HTMLPreElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (streamingContentRef.current) {
      streamingContentRef.current.scrollTop = streamingContentRef.current.scrollHeight;
    }
  }, [streamingContent]);

  const enhance = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    setStreamingContent('');
    setCurrentStatus('Initializing...');
    setShowTypingIndicator(true);

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
                const statusInfo = STATUS_MESSAGES.find(s => data.message.includes(s.key.split('...')[0]));
                if (statusInfo) {
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
    } catch {
      setError('Falha ao processar. Tente novamente.');
      setShowTypingIndicator(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
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

  const isStreaming = loading && (streamingContent || currentStatus);
  const maxChars = 4000;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        
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

        {/* Input Section - Using PromptInput Component */}
        <div
          className={`mb-6 sm:mb-8 w-full transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <PromptInput
            value={input}
            onChange={setInput}
            onSubmit={enhance}
            loading={loading}
            disabled={!input.trim()}
            maxChars={maxChars}
            placeholderExamples={PLACEHOLDER_EXAMPLES}
          />
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
