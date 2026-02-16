namespace PEE.Core.Entities;

public class PromptRequest
{
    public string Input { get; set; } = string.Empty;
    public string Mode { get; set; } = "general";
    public string? Domain { get; set; }
}

public class PromptResponse
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OriginalInput { get; set; } = string.Empty;
    public string OptimizedPrompt { get; set; } = string.Empty;
    public List<string> ImprovementsApplied { get; set; } = new();
    public PromptScore Score { get; set; } = new();
    public string CompactVersion { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PromptScore
{
    public double Clarity { get; set; }
    public double Specificity { get; set; }
    public double Executability { get; set; }
    public double AmbiguityControl { get; set; }
    public double Structure { get; set; }
    public double FinalScore => (Clarity + Specificity + Executability + AmbiguityControl + Structure) / 5;
}

public class IntentAnalysis
{
    public string MainObjective { get; set; } = string.Empty;
    public string ExpectedResult { get; set; } = string.Empty;
    public List<string> Ambiguities { get; set; } = new();
    public List<string> MissingInfo { get; set; } = new();
    public string Domain { get; set; } = "general";
    public double Confidence { get; set; }
}

public class DomainContext
{
    public string Domain { get; set; } = "general";
    public List<string> GoodPractices { get; set; } = new();
    public List<string> CommonPitfalls { get; set; } = new();
    public List<string> RequiredContext { get; set; } = new();
}

public class StructuredPrompt
{
    public string Context { get; set; } = string.Empty;
    public string AgentRole { get; set; } = string.Empty;
    public string Objective { get; set; } = string.Empty;
    public List<string> ScopeIncludes { get; set; } = new();
    public List<string> ScopeExcludes { get; set; } = new();
    public List<string> Restrictions { get; set; } = new();
    public string OutputFormat { get; set; } = string.Empty;
    public List<string> QualityCriteria { get; set; } = new();
    public List<string> ExecutionSteps { get; set; } = new();
    public List<string> EdgeCases { get; set; } = new();
}
