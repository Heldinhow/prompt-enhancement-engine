'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Copy, Check, Zap, Target, Layers, Brain, Wand2, FileText, Gauge } from 'lucide-react';

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

export default function Home() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Streaming state
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [statusIcon, setStatusIcon] = useState<typeof Brain>(Brain);
  const [statusColor, setStatusColor] = useState('text-blue-400');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  const streamingContentRef = useRef<HTMLPreElement>(null);

  // Auto-scroll streaming content
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

  const copyToClipboard = () => {
    const textToCopy = result?.optimized_prompt || streamingContent;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-400/10 border-emerald-400/20';
    if (score >= 6) return 'bg-yellow-400/10 border-yellow-400/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  // Determine if we're in streaming mode (content coming in but no final result yet)
  const isStreaming = loading && (streamingContent || currentStatus);

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Factory-style: minimal dark with clean lines */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        
        {/* Header - Factory style */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-6 sm:mb-8 font-mono">
            <Sparkles className="w-3 h-3" />
            PROMPT ENHANCEMENT ENGINE
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight mb-4">
            Transform prompts into
            <br />
            <span className="text-purple-400">structured instructions</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto px-2">
            Optimize your prompts for AI agents with clarity, structure, and measurable quality.
          </p>
        </div>

        {/* Input Section - Clean with subtle border */}
        <div className="mb-8 sm:mb-12">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey && !loading && input.trim()) {
                enhance();
              }
            }}
            placeholder="Describe what you want the AI agent to do..."
            className="w-full bg-black border border-white/10 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none font-mono text-sm min-h-[100px]"
            rows={4}
          />
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-4">
            <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`px-3 py-2 sm:py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap min-h-[44px] ${
                    mode === m.value
                      ? 'bg-white text-black'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={enhance}
              disabled={loading || !input.trim()}
              className="px-6 py-3 sm:py-2 bg-white text-black rounded text-sm font-mono hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  STREAMING
                </span>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  ENHANCE
                </>
              )}
            </button>
          </div>
        </div>

        {/* Processing Status Indicator */}
        {loading && (
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              {/* Animated status icon */}
              <div className={`p-2 rounded-full bg-white/10 ${statusColor}`}>
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
                  {/* Typing dots animation */}
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
              
              {/* Progress indicator */}
              <div className="hidden sm:block w-24 h-1 bg-white/10 rounded-full overflow-hidden">
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
          <div className="mb-6 sm:mb-8 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {/* Streaming Content Preview */}
        {isStreaming && streamingContent && (
          <div className="mb-6 sm:mb-8 border border-purple-500/30 rounded-lg overflow-hidden animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/30 bg-purple-500/5">
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
              className="p-4 text-xs sm:text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto"
            >
              {streamingContent}
              {/* Blinking cursor */}
              <span className="inline-block w-0.5 h-4 bg-purple-400 animate-pulse ml-0.5" />
            </pre>
          </div>
        )}

        {/* Final Result */}
        {result && !loading && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* Score - Factory style minimal */}
            <div className={`border rounded-lg p-4 sm:p-6 ${getScoreBg(result.score.final_score)}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-gray-500">QUALITY SCORE</span>
                <span className={`text-2xl font-mono ${getScoreColor(result.score.final_score)}`}>
                  {result.score.final_score.toFixed(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { label: 'CLARITY', value: result.score.clarity, key: 'clarity' },
                  { label: 'SPECIFIC', value: result.score.specificity, key: 'specificity' },
                  { label: 'EXECUTE', value: result.score.executability, key: 'executability' },
                  { label: 'AMBIG', value: result.score.ambiguity_control, key: 'ambiguity_control' },
                  { label: 'STRUCT', value: result.score.structure, key: 'structure' },
                ].map((item) => (
                  <div key={item.key} className="text-center p-2 sm:p-3 rounded bg-white/5 min-h-[70px] flex flex-col justify-center">
                    <div className={`text-lg sm:text-xl font-mono ${getScoreColor(item.value)}`}>
                      {item.value.toFixed(0)}
                    </div>
                    <div className="text-[10px] sm:text-xs font-mono text-gray-600 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}
            <div className="flex flex-wrap gap-2">
              {result.improvements_applied.map((imp, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1.5 rounded bg-white/5 text-xs font-mono text-gray-400 border border-white/10"
                >
                  {imp}
                </span>
              ))}
            </div>

            {/* Optimized Prompt */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                <span className="text-xs font-mono text-gray-500">OPTIMIZED PROMPT</span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-white min-h-[36px] px-2"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <pre className="p-4 text-xs sm:text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {result.optimized_prompt}
              </pre>
            </div>

            {/* Compact */}
            <div className="px-4 py-3 sm:py-2 bg-white/5 rounded border border-white/10">
              <span className="text-xs font-mono text-gray-600">SHORT: </span>
              <span className="text-xs font-mono text-gray-400">{result.compact_version}</span>
            </div>
          </div>
        )}

        {/* Footer - Minimal */}
        <div className="mt-12 sm:mt-20 text-center">
          <p className="text-xs font-mono text-gray-700">
            POWERED BY MINIMAX M2.5 • STREAMING ENABLED
          </p>
        </div>
      </div>
    </div>
  );
}
