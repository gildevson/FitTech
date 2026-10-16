public class WorkoutLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid WorkoutId { get; set; }
    public DateTime LoggedDate { get; set; }
    public string Status { get; set; } = "done";
    public string? SkipReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
