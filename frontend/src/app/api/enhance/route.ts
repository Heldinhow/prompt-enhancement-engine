import { NextRequest, NextResponse } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1';

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

export async function POST(req: NextRequest) {
  try {
    const { input, mode = 'general' } = await req.json();

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    let optimizedPrompt: string;

    if (MINIMAX_API_KEY) {
      try {
        const response = await fetch(`${MINIMAX_BASE_URL}/text/chatcompletion_v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'MiniMax-M2.1',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Input original: ${input}\n\nModo: ${mode}\n\nGere o prompt estruturado seguindo o formato definido.` }
            ],
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
          optimizedPrompt = data.choices[0].message.content;
        } else {
          throw new Error('Invalid response');
        }
      } catch (apiError) {
        console.error('MiniMax API error:', apiError);
        optimizedPrompt = generateStructuredPrompt(input, mode);
      }
    } else {
      optimizedPrompt = generateStructuredPrompt(input, mode);
    }

    const score = calculateScore(optimizedPrompt);
    const lines = optimizedPrompt.split('\n').filter(l => l.trimStart().startsWith('#')).slice(0, 3);
    const compactVersion = lines.map(l => l.replace(/^#+\s*/, '').trim()).join(' → ');

    const result: PromptResponse = {
      optimized_prompt: optimizedPrompt,
      improvements_applied: [
        'Intent extraction',
        'Domain context enrichment',
        'Structural optimization',
        `Quality scoring (${score.final_score.toFixed(1)})`,
      ],
      score,
      compact_version: compactVersion,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
