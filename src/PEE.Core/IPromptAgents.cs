using PEE.Core.Entities;

namespace PEE.Core.Interfaces;

public interface IIntentExtractor
{
    Task<IntentAnalysis> ExtractIntentAsync(string input, CancellationToken ct = default);
}

public interface IDomainSpecialist
{
    Task<DomainContext> GetDomainContextAsync(string domain, CancellationToken ct = default);
    string DetectDomain(string input);
}

public interface IStructureEnhancer
{
    Task<string> EnhanceStructureAsync(IntentAnalysis intent, DomainContext domain, string input, CancellationToken ct = default);
}

public interface IQualityScorer
{
    Task<PromptScore> CalculateScoreAsync(string prompt, CancellationToken ct = default);
}

public interface IPromptOrchestrator
{
    Task<PromptResponse> EnhancePromptAsync(PromptRequest request, CancellationToken ct = default);
}
