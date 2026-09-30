public interface IWorkoutRepository
{
    Task<IEnumerable<Workout>> GetAllAsync();
    Task<IEnumerable<Workout>> GetByWorkoutPlanAsync(int workoutPlanId);
    Task<Workout?> GetByIdAsync(int id);
    Task<int> CreateAsync(Workout workout);
    Task<bool> UpdateAsync(Workout workout);
    Task<bool> DeleteAsync(int id);
}
