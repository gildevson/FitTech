using System.Text.Json;
using System.Text.Json.Serialization;

public class WorkoutExercise
{
    public Guid Id { get; set; }
    public Guid WorkoutId { get; set; }
    public Guid ExerciseId { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty; // e.g. "10" or "8-12"
    public int RestSeconds { get; set; }
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }

    // Carga planejada de cada série (null = sem carga definida). Gravada como JSON na coluna set_weights.
    [JsonIgnore]
    public string? SetWeightsJson { get; set; }

    public List<decimal?>? SetWeights
    {
        get => string.IsNullOrEmpty(SetWeightsJson) ? null : JsonSerializer.Deserialize<List<decimal?>>(SetWeightsJson);
        set => SetWeightsJson = value is null || value.Count == 0 ? null : JsonSerializer.Serialize(value);
    }

    // Navigation
    public string? ExerciseName { get; set; }
    public string? MuscleGroupName { get; set; }
}
