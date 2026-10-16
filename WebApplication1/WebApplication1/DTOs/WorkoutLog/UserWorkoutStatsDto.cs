public class UserWorkoutStatsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public int TotalLogs { get; set; }
    public int LogsThisWeek { get; set; }
    public int LogsThisMonth { get; set; }
    public DateTime? LastWorkoutDate { get; set; }
}

public class UserWorkoutLogDto
{
    public Guid Id { get; set; }
    public DateTime LoggedDate { get; set; }
    public string WorkoutName { get; set; } = "";
    public string PlanName { get; set; } = "";
    public string Status { get; set; } = "done";
    public string? SkipReason { get; set; }
}
