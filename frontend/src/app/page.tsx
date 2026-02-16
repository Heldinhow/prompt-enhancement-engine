'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Copy, Check, Target, Brain, Wand2, FileText, Gauge, Zap } from 'lucide-react';
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
  { key: 'Analyzing', icon: Brain, color: 'text-blue-400' },
  { key: 'Calling', icon: Wand2, color: 'text-purple-400' },
  { key: 'Streaming', icon: FileText, color: 'text-amber-400' },
  { key: 'Template', icon: FileText, color: 'text-gray-400' },
  { key: 'Generating', icon: FileText, color: 'text-gray-400' },
  { key: 'Calculating', icon: Gauge, color: 'text-green-400' },
];

const PLACEHOLDER_EXAMPLES = [
  "Create a Python script that fetches data from an API and saves it to a CSV file",
  "Write a marketing email for a new eco-friendly product launch",
  "Design a database schema for a task management application",
];

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  
  const [streamingContent, setStreamingContent] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [statusColor, setStatusColor] = useState('text-gray-400');
  
  const streamingContentRef = useRef<HTMLPreElement>(null);

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

    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const response = await fetch('/api/enhance/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode: 'general' }),
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
                const statusInfo = STATUS_MESSAGES.find(s => data.message.includes(s.key));
                if (statusInfo) {
                  setStatusColor(statusInfo.color);
                }
              } else if (data.type === 'chunk') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'complete') {
                setResult(data);
              } else if (data.type === 'error') {
                setError(data.error || 'Unknown error');
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch {
      setError('Falha ao processar. Tente novamente.');
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

  const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full transition-all duration-500 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{value}%</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-3xl mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500 mb-6 font-mono tracking-wider">
            <Zap className="w-3 h-3" />
            PROMPT ENHANCEMENT
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight mb-4">
            Transform prompts into
            <br />
            <span className="text-white/80">structured instructions</span>
          </h1>
          <p className="text-gray-500 text-base max-w-lg mx-auto">
            Optimize your prompts for AI agents with clarity, structure, and measurable quality.
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8 w-full">
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

        {/* Processing Status */}
        {loading && (
          <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${statusColor.replace('text-', 'bg-')} animate-pulse`} />
              <span className={`text-sm font-mono ${statusColor}`}>
                {currentStatus || 'Processing...'}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Streaming Preview */}
        {isStreaming && streamingContent && (
          <div className="mb-6 border border-white/10 rounded-xl overflow-hidden" id="result-section">
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
                GENERATING
              </span>
            </div>
            <pre 
              ref={streamingContentRef}
              className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar"
            >
              {streamingContent}
              <span className="inline-block w-0.5 h-4 bg-white/60 animate-pulse ml-0.5" />
            </pre>
          </div>
        )}

        {/* Final Result */}
        {result && !loading && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" id="result-section">
            
            {/* Optimized Prompt Card */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Target className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Optimized Prompt</span>
                </div>
                <button
                  onClick={() => copyToClipboard(result.optimized_prompt, 'optimized')}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  {copied === 'optimized' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
                {result.optimized_prompt}
              </pre>
            </div>

            {/* Score Card */}
            {result.score && (
              <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03]">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <Sparkles className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Quality Score</span>
                  <span className="ml-auto text-lg font-mono text-white">{result.score.final_score}%</span>
                </div>
                <div className="p-5 space-y-4">
                  <ScoreBar label="Clarity" value={result.score.clarity} />
                  <ScoreBar label="Specificity" value={result.score.specificity} />
                  <ScoreBar label="Executability" value={result.score.executability} />
                  <ScoreBar label="Structure" value={result.score.structure} />
                </div>
              </div>
            )}

            {/* Improvements Applied */}
            {result.improvements_applied && result.improvements_applied.length > 0 && (
              <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.03]">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <Zap className="w-4 h-4 text-white/60" />
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Improvements</span>
                </div>
                <div className="p-5 flex flex-wrap gap-2">
                  {result.improvements_applied.map((improvement, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 text-xs font-mono text-gray-400 bg-white/5 rounded-lg border border-white/5"
                    >
                      {improvement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs font-mono text-gray-700">
            POWERED BY MINIMAX M2.5
          </p>
        </div>
      </div>
    </div>
  );
}
