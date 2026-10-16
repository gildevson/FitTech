public class WorkoutStatsDto
{
    public IEnumerable<RecentWorkoutLogDto> RecentActivity { get; set; } = [];
    public IEnumerable<PopularPlanDto> PopularPlans { get; set; } = [];
}

public class RecentWorkoutLogDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = "";
    public string WorkoutName { get; set; } = "";
    public string PlanName { get; set; } = "";
    public DateTime LoggedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PopularPlanDto
{
    public string PlanName { get; set; } = "";
    public int LogCount { get; set; }
    public int UserCount { get; set; }
}
