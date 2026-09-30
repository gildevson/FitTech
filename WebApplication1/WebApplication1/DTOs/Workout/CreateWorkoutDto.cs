public class CreateWorkoutDto
{
    public int WorkoutPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DayOfWeek { get; set; }
    public int OrderIndex { get; set; }
}
