public class WorkoutSetLogDto
{
    public Guid WorkoutExerciseId { get; set; }
    public int SetIndex { get; set; }
    public decimal? WeightKg { get; set; }
    public int? Reps { get; set; }
}
