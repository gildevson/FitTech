public interface IWorkoutPlanRepository
{
    Task<IEnumerable<WorkoutPlan>> GetAllAsync();
    Task<WorkoutPlan?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(WorkoutPlan plan);
    Task<bool> UpdateAsync(WorkoutPlan plan);
    Task<bool> DeleteAsync(Guid id);
}
