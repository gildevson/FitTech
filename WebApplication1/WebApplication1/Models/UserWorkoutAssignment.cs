public class UserWorkoutAssignment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid WorkoutId { get; set; }
    public DateTime AssignedAt { get; set; }
}
