using System.Text.Json.Serialization;

public class UpdateWorkoutExerciseDto
{
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty;
    public int RestSeconds { get; set; }
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }

    // Carga por série. Só é alterada quando vem no JSON (o painel admin não envia e não deve apagá-la)
    private List<decimal?>? _setWeights;
    public List<decimal?>? SetWeights
    {
        get => _setWeights;
        set { _setWeights = value; SetWeightsProvided = true; }
    }

    [JsonIgnore]
    public bool SetWeightsProvided { get; private set; }
}
