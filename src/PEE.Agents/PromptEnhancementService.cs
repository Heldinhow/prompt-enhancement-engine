using Microsoft.Extensions.Logging;
using System.Text.Json;
using PEE.Core.Entities;

namespace PEE.Agents;

public class PromptEnhancementService
{
    private readonly ILogger<PromptEnhancementService> _logger;
    private readonly string _apiKey;
    private readonly HttpClient _httpClient;

    public PromptEnhancementService(ILogger<PromptEnhancementService> logger, HttpClient httpClient)
    {
        _logger = logger;
        _apiKey = Environment.GetEnvironmentVariable("MINIMAX_API_KEY") ?? "";
        _httpClient = httpClient;
    }

    public async Task<PromptResponse> EnhanceAsync(PromptRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation("Enhancing prompt: {Input}", request.Input.Substring(0, Math.Min(50, request.Input.Length)));

        // Call MiniMax API to enhance the prompt
        var enhanced = await CallMiniMaxAsync(request.Input, request.Mode, ct);

        // Calculate score
        var score = CalculateScore(enhanced);

        return new PromptResponse
        {
            Id = Guid.NewGuid().ToString(),
            OriginalInput = request.Input,
            OptimizedPrompt = enhanced,
            ImprovementsApplied = new List<string>
            {
                "Intent extraction",
                "Domain context enrichment",
                "Structural optimization",
                $"Quality scoring ({score.FinalScore:F1})"
            },
            Score = score,
            CompactVersion = enhanced.Split('\n').Take(3).Select(l => l.TrimStart('#').Trim()).Aggregate((a, b) => a + " → " + b)
        };
    }

    private async Task<string> CallMiniMaxAsync(string input, string mode, CancellationToken ct)
    {
        // If no API key, return a structured template
        if (string.IsNullOrEmpty(_apiKey))
        {
            return GenerateStructuredPrompt(input, mode);
        }

        var systemPrompt = @"You are a Prompt Enhancement Engine. Transform vague inputs into highly structured, executable prompts for AI agents.

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
[How to handle edge cases]";

        var userPrompt = $"Input original: {input}\n\nModo: {mode}\n\nGere o prompt estruturado seguindo o formato definido.";

        try
        {
            var request = new
            {
                model = "MiniMax-M2.1",
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = 0.7,
                max_tokens = 4096
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");

            var response = await _httpClient.PostAsync("https://api.minimax.chat/v1/text/chatcompletion_v2", content, ct);
            var responseJson = await response.Content.ReadAsStringAsync(ct);
            
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);
            return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? GenerateStructuredPrompt(input, mode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MiniMax API call failed");
            return GenerateStructuredPrompt(input, mode);
        }
    }

    private string GenerateStructuredPrompt(string input, string mode)
    {
        return $@"# CONTEXTO
Usuário solicitou: {input}
Modo: {mode}

# PAPEL DO AGENTE
Especialista em {mode} com capacidade de análise e execução de tarefas complexas.

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
- Solicitações ambíguas: pedir esclarecimento";
    }

    private PromptScore CalculateScore(string prompt)
    {
        var score = new PromptScore();
        
        // Simple heuristic scoring
        score.Clarity = prompt.Contains("# OBJETIVO") ? 9 : 6;
        score.Specificity = prompt.Length > 500 ? 8 : 5;
        score.Executability = prompt.Contains("# PASSOS") ? 9 : 5;
        score.AmbiguityControl = prompt.Contains("?") ? 6 : 8;
        score.Structure = prompt.Count(c => c == '#') >= 5 ? 9 : 5;

        return score;
    }
}
