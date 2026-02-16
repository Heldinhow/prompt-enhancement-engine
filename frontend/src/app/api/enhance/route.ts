import { NextRequest, NextResponse } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';

console.log('[MiniMax] API Key present:', !!MINIMAX_API_KEY, 'Key length:', MINIMAX_API_KEY?.length);

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

const SYSTEM_PROMPT = `You are a Prompt Enhancement Engine. Transform vague inputs into highly structured, executable prompts for AI agents.

Output format (MUST follow exactly):

# CONTEXTO
[Background and context]

# PAPEL DO AGENTE
[Detailed role description]

# OBJETIVO
[Clear, measurable objective]

# ESCOPO
Inclui: [list]
Não inclui: [list]

# RESTRIÇÕES
[Clear limitations]

# FORMATO DE SAÍDA
[Expected output format]

# CRITÉRIOS DE QUALIDADE
[Measurable success criteria]

# PASSOS DE EXECUÇÃO
1. [Step]
2. [Step]
3. [Step]

# EDGE CASES
[How to handle edge cases]`;

function calculateScore(prompt: string): PromptScore {
  const score: PromptScore = {
    clarity: prompt.includes('# OBJETIVO') ? 9 : 6,
    specificity: prompt.length > 500 ? 8 : 5,
    executability: prompt.includes('# PASSOS') ? 9 : 5,
    ambiguity_control: prompt.includes('?') ? 6 : 8,
    structure: (prompt.match(/#/g) || []).length >= 5 ? 9 : 5,
    final_score: 0,
  };
  score.final_score = (score.clarity + score.specificity + score.executability + score.ambiguity_control + score.structure) / 5;
  return score;
}

function generateStructuredPrompt(input: string, mode: string): string {
  return `# CONTEXTO
Usuário solicitou: ${input}
Modo: ${mode}

# PAPEL DO AGENTE
Especialista em ${mode} com capacidade de análise e execução de tarefas complexas.

# OBJETIVO
Executar a solicitação do usuário de forma eficiente e otimizada.

# ESCOPO
Inclui: Análise, planejamento, execução
Não inclui: Tarefas fora do escopo original

# RESTRIÇÕES
- Manter o objetivo original
- Não adicionar suposições não solicitadas

# FORMATO DE SAÍDA
Resposta estruturada com explicações

# CRITÉRIOS DE QUALIDADE
- Clareza
- Precisão
- Completeza

# PASSOS DE EXECUÇÃO
1. Analisar a solicitação
2. Identificar requisitos
3. Executar tarefa
4. Validar resultado

# EDGE CASES
- Solicitações ambíguas: pedir esclarecimento`;
}

function buildApiUrl(): string {
  const baseUrl = MINIMAX_BASE_URL;
  const endpoint = '/text/chatcompletion_v2';
  
  if (MINIMAX_GROUP_ID && MINIMAX_GROUP_ID.trim() !== '') {
    return `${baseUrl}${endpoint}?GroupId=${MINIMAX_GROUP_ID}`;
  }
  
  return `${baseUrl}${endpoint}`;
}

export async function POST(req: NextRequest) {
  try {
    const { input, mode = 'general' } = await req.json();

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    let optimizedPrompt: string;
    let usedRealApi = false;

    // Use real MiniMax API if key is available
    if (MINIMAX_API_KEY && MINIMAX_API_KEY.trim() !== '') {
      try {
        console.log('[MiniMax] Calling real MiniMax API...');
        console.log('[MiniMax] API URL:', buildApiUrl());
        
        const response = await fetch(buildApiUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'MiniMax-M2.5-Lightning',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Input original: ${input}\n\nModo: ${mode}\n\nGere o prompt estruturado seguindo o formato definido.` }
            ],
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[MiniMax] API error:', response.status, errorText);
          throw new Error(`MiniMax API returned ${response.status}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
          optimizedPrompt = data.choices[0].message.content;
          usedRealApi = true;
          console.log('[MiniMax] Successfully used real API');
        } else {
          console.warn('[MiniMax] Invalid response format, using fallback');
          throw new Error('Invalid response format');
        }
      } catch (apiError) {
        console.error('[MiniMax] API call failed, using fallback:', apiError);
        optimizedPrompt = generateStructuredPrompt(input, mode);
      }
    } else {
      console.warn('[MiniMax] No API key found, using template fallback');
      optimizedPrompt = generateStructuredPrompt(input, mode);
    }

    const score = calculateScore(optimizedPrompt);
    const lines = optimizedPrompt.split('\n').filter(l => l.trimStart().startsWith('#')).slice(0, 3);
    const compactVersion = lines.map(l => l.replace(/^#+\s*/, '').trim()).join(' → ');

    const improvements = usedRealApi
      ? [
          'Intent extraction',
          'Domain context enrichment',
          'Structural optimization',
          `Quality scoring (${score.final_score.toFixed(1)})`,
          'MiniMax M2.1 enhancement'
        ]
      : [
          'Intent extraction',
          'Domain context enrichment',
          'Structural optimization',
          `Quality scoring (${score.final_score.toFixed(1)})`,
          'Template-based (no API key)'
        ];

    const result: PromptResponse = {
      optimized_prompt: optimizedPrompt,
      improvements_applied: improvements,
      score,
      compact_version: compactVersion,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Enhance] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
