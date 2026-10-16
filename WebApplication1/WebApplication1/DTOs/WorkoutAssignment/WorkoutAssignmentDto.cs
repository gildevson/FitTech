public class AssignWorkoutDto
{
    public List<Guid> UserIds { get; set; } = [];
}

public class AssignedWorkoutDto
{
    public Guid Id { get; set; }
    public Guid WorkoutId { get; set; }
    public string WorkoutName { get; set; } = "";
    public string PlanName { get; set; } = "";
    public int DayOfWeek { get; set; }
    public DateTime AssignedAt { get; set; }
}

public class WorkoutAssigneeDto
{
    public Guid AssignmentId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = "";
    public string UserEmail { get; set; } = "";
    public DateTime AssignedAt { get; set; }
}
