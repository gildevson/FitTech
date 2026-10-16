public class CreateWorkoutLogDto
{
    public Guid WorkoutId { get; set; }
    public DateTime? LoggedDate { get; set; }
    /// <summary>"done" (padrão) ou "skipped"</summary>
    public string? Status { get; set; }
    public string? SkipReason { get; set; }
}
