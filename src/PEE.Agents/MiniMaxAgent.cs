using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace PEE.Agents;

public class MiniMaxPromptAgent
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public MiniMaxPromptAgent(HttpClient httpClient, string apiKey)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
        _baseUrl = "https://api.minimax.chat/v1";
    }

    public async Task<string> CallAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
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

        try
        {
            var response = await _httpClient.PostAsync($"{_baseUrl}/text/chatcompletion_v2", content, ct);
            var responseJson = await response.Content.ReadAsStringAsync(ct);
            
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);
            return result.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "";
        }
        catch
        {
            return "{}";
        }
    }
}
