public class WorkoutExercise
{
    public int Id { get; set; }
    public int WorkoutId { get; set; }
    public int ExerciseId { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty; // e.g. "10" or "8-12"
    public int RestSeconds { get; set; }
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }
    // Navigation
    public string? ExerciseName { get; set; }
    public string? MuscleGroupName { get; set; }
}
