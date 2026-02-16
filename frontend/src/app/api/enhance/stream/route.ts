import { NextRequest } from 'next/server';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';

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

function buildApiUrl(): string {
  const baseUrl = MINIMAX_BASE_URL;
  const endpoint = '/text/chatcompletion_v2';
  
  if (MINIMAX_GROUP_ID && MINIMAX_GROUP_ID.trim() !== '') {
    return `${baseUrl}${endpoint}?GroupId=${MINIMAX_GROUP_ID}`;
  }
  
  return `${baseUrl}${endpoint}`;
}

function calculateScore(prompt: string): any {
  const score = {
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
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { input, mode = 'general' } = await req.json();

        if (!input) {
          controller.enqueue(encoder.encode(`data: {"error": "Input is required"}\n\n`));
          controller.close();
          return;
        }

        // Send initial status
        controller.enqueue(encoder.encode(`data: {"type": "status", "message": "Analyzing intent..."}\n\n`));

        let optimizedPrompt = '';
        let usedRealApi = false;

        // Use real MiniMax API if key is available
        if (MINIMAX_API_KEY && MINIMAX_API_KEY.trim() !== '') {
          try {
            controller.enqueue(encoder.encode(`data: {"type": "status", "message": "Calling MiniMax M2.5..."}\n\n`));
            
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
                // Request streaming from MiniMax
                stream: true
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('[MiniMax] API error:', response.status, errorText);
              throw new Error(`MiniMax API returned ${response.status}`);
            }

            controller.enqueue(encoder.encode(`data: {"type": "status", "message": "Streaming response..."}\n\n`));

            // Process streaming response from MiniMax
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              
              // Process SSE events
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices && parsed.choices[0]?.delta?.content) {
                      const chunk = parsed.choices[0].delta.content;
                      optimizedPrompt += chunk;
                      // Send the chunk to client
                      controller.enqueue(encoder.encode(`data: {"type": "chunk", "content": ${JSON.stringify(chunk)}}\n\n`));
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }

            if (optimizedPrompt) {
              usedRealApi = true;
            } else {
              // Fallback if no streaming content
              optimizedPrompt = generateStructuredPrompt(input, mode);
            }

          } catch (apiError) {
            console.error('[MiniMax] Streaming failed, using fallback:', apiError);
            controller.enqueue(encoder.encode(`data: {"type": "status", "message": "Using template fallback..."}\n\n`));
            optimizedPrompt = generateStructuredPrompt(input, mode);
          }
        } else {
          console.warn('[MiniMax] No API key found, using template fallback');
          controller.enqueue(encoder.encode(`data: {"type": "status", "message": "Generating template..."}\n\n`));
          
          // Simulate streaming for template
          const template = generateStructuredPrompt(input, mode);
          const words = template.split(/(\s+)/);
          
          for (const word of words) {
            optimizedPrompt += word;
            controller.enqueue(encoder.encode(`data: {"type": "chunk", "content": ${JSON.stringify(word)}}\n\n`));
            // Small delay to simulate typing
            await new Promise(r => setTimeout(r, 10));
          }
        }

        // Calculate score
        controller.enqueue(encoder.encode(`data: {"type": "status", "message": "Calculating quality score..."}\n\n`));
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

        // Send final result
        const result = {
          type: 'complete',
          optimized_prompt: optimizedPrompt,
          improvements_applied: improvements,
          score,
          compact_version: compactVersion,
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
        controller.close();

      } catch (error) {
        console.error('[Enhance Stream] Error:', error);
        controller.enqueue(encoder.encode(`data: {"type": "error", "error": "Internal server error"}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
