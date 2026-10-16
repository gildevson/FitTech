public interface IUserWorkoutAssignmentRepository
{
    Task<IEnumerable<WorkoutAssigneeDto>> GetAssigneesAsync(Guid workoutId);
    Task<IEnumerable<AssignedWorkoutDto>> GetByUserAsync(Guid userId);
    Task AssignAsync(Guid workoutId, IEnumerable<Guid> userIds);
    Task UnassignAsync(Guid workoutId, Guid userId);
}
