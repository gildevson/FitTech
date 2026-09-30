public class Workout
{
    public int Id { get; set; }
    public int WorkoutPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DayOfWeek { get; set; } // 0=Sunday, 1=Monday...6=Saturday
    public int OrderIndex { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? WorkoutPlanName { get; set; }
}
