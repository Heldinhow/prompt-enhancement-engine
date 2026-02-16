using PEE.Agents;
using PEE.Core.Entities;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddHttpClient<PromptEnhancementService>();
builder.Services.AddSingleton<PromptEnhancementService>();

var app = builder.Build();

// In-memory storage
var prompts = new List<PromptResponse>();

// API Endpoints
app.MapPost("/api/prompts/enhance", async (PromptRequest request, PromptEnhancementService service) =>
{
    var response = await service.EnhanceAsync(request);
    prompts.Insert(0, response);
    if (prompts.Count > 100) prompts.RemoveAt(prompts.Count - 1);
    return Results.Ok(response);
})
.WithName("EnhancePrompt")
.WithSummary("Enhance a prompt");

app.MapGet("/api/prompts/history", () => Results.Ok(prompts.Take(50)))
.WithName("GetHistory")
.WithSummary("Get prompt history");

app.MapGet("/api/prompts/{id}", (string id) =>
{
    var prompt = prompts.FirstOrDefault(p => p.Id == id);
    return prompt is not null ? Results.Ok(prompt) : Results.NotFound();
})
.WithName("GetPromptById")
.WithSummary("Get prompt by ID");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
