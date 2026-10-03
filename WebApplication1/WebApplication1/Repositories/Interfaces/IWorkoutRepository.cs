public interface IWorkoutRepository
{
    Task<IEnumerable<Workout>> GetAllAsync();
    Task<IEnumerable<Workout>> GetByWorkoutPlanAsync(Guid workoutPlanId);
    Task<Workout?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(Workout workout);
    Task<bool> UpdateAsync(Workout workout);
    Task<bool> DeleteAsync(Guid id);
}
