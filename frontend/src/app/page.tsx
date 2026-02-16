'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, Zap, Target, Layers } from 'lucide-react';

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

export default function Home() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const enhance = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode }),
      });

      if (!response.ok) throw new Error('Erro ao processar');
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Falha ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.optimized_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-white';
    if (score >= 6) return 'text-gray-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Factory-style: minimal dark with clean lines */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Header - Factory style */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 mb-8 font-mono">
            <Sparkles className="w-3 h-3" />
            PROMPT ENHANCEMENT ENGINE
          </div>
          
          <h1 className="text-4xl md:text-5xl font-normal tracking-tight mb-4">
            Transform prompts into
            <br />
            <span className="text-purple-400">structured instructions</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Optimize your prompts for AI agents with clarity, structure, and measurable quality.
          </p>
        </div>

        {/* Input Section - Clean with subtle border */}
        <div className="mb-12">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want the AI agent to do..."
            className="w-full bg-black border border-white/10 rounded-lg p-4 text-white placeholder-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none font-mono text-sm"
            rows={3}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
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
              className="px-6 py-2 bg-white text-black rounded text-sm font-mono hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                  PROCESSING
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

        {/* Error */}
        {error && (
          <div className="mb-8 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-500">
            
            {/* Score - Factory style minimal */}
            <div className="border border-white/10 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-gray-500">QUALITY SCORE</span>
                <span className={`text-2xl font-mono ${getScoreColor(result.score.final_score)}`}>
                  {result.score.final_score.toFixed(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'CLARITY', value: result.score.clarity },
                  { label: 'SPECIFIC', value: result.score.specificity },
                  { label: 'EXECUTE', value: result.score.executability },
                  { label: 'AMBIG', value: result.score.ambiguity_control },
                  { label: 'STRUCT', value: result.score.structure },
                ].map((item) => (
                  <div key={item.label} className="text-center p-2 rounded bg-white/5">
                    <div className={`text-lg font-mono ${getScoreColor(item.value)}`}>
                      {item.value.toFixed(0)}
                    </div>
                    <div className="text-[10px] font-mono text-gray-600 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}
            <div className="flex flex-wrap gap-2">
              {result.improvements_applied.map((imp, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1 rounded bg-white/5 text-xs font-mono text-gray-400 border border-white/10"
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
                  className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {result.optimized_prompt}
              </pre>
            </div>

            {/* Compact */}
            <div className="px-4 py-2 bg-white/5 rounded border border-white/10">
              <span className="text-xs font-mono text-gray-600">SHORT: </span>
              <span className="text-xs font-mono text-gray-400">{result.compact_version}</span>
            </div>
          </div>
        )}

        {/* Footer - Minimal */}
        <div className="mt-20 text-center">
          <p className="text-xs font-mono text-gray-700">
            POWERED BY MINIMAX M2.5
          </p>
        </div>
      </div>
    </div>
  );
}
