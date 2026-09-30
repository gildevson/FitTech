public class UpdateWorkoutExerciseDto
{
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty;
    public int RestSeconds { get; set; }
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }
}
