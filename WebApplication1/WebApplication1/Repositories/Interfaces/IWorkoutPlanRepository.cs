public interface IWorkoutPlanRepository
{
    Task<IEnumerable<WorkoutPlan>> GetAllAsync();
    Task<WorkoutPlan?> GetByIdAsync(int id);
    Task<int> CreateAsync(WorkoutPlan plan);
    Task<bool> UpdateAsync(WorkoutPlan plan);
    Task<bool> DeleteAsync(int id);
}
