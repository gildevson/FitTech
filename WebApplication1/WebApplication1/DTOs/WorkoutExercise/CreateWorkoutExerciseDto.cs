public class CreateWorkoutExerciseDto
{
    public int WorkoutId { get; set; }
    public int ExerciseId { get; set; }
    public int Sets { get; set; } = 3;
    public string Reps { get; set; } = "10";
    public int RestSeconds { get; set; } = 60;
    public int OrderIndex { get; set; }
    public string? Notes { get; set; }
}
