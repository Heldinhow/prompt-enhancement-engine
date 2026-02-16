# SPEC.md - Prompt Enhancement Engine (PEE)

## Overview
Sistema que transforma linguagem natural em prompts otimizados para agentes autônomos.

## Arquitetura

### Agentes
1. **PromptOrchestrator** - Agente principal que coordena o fluxo
2. **IntentExtractor** - Extrai intenção e detecta ambiguidades
3. **DomainSpecialist** - Identifica domínio e adiciona contexto
4. **StructureEnhancer** - Estrutura o prompt final
5. **QualityScorer** - Calcula scores de qualidade

## Pipeline

```
Input → IntentExtractor → DomainSpecialist → StructureEnhancer → QualityScorer → Output
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/prompts/enhance | Enhance prompt |
| GET | /api/prompts/history | History |
| GET | /api/prompts/{id} | Get by ID |

## Output

```json
{
  "optimized_prompt": "...",
  "improvements_applied": ["..."],
  "score": {
    "clarity": 0-10,
    "specificity": 0-10,
    "executability": 0-10,
    "ambiguity_control": 0-10,
    "structure": 0-10,
    "final_score": 0-10
  },
  "compact_version": "..."
}
```

## Domínios Suportados
- coding
- marketing
- produto
- jurídico
- automação
- ia
- geral

## Estrutura de Arquivos
```
src/
  PEE.Core/
    Entities/
    Interfaces/
    Services/
  PEE.Agents/
    IntentExtractor/
    DomainSpecialist/
    StructureEnhancer/
    QualityScorer/
  PEE.Api/
    Endpoints/
    Controllers/
```
