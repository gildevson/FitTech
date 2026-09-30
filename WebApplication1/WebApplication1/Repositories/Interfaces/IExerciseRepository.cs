public interface IExerciseRepository
{
    Task<IEnumerable<Exercise>> GetAllAsync();
    Task<IEnumerable<Exercise>> GetByMuscleGroupAsync(int muscleGroupId);
    Task<Exercise?> GetByIdAsync(int id);
    Task<int> CreateAsync(Exercise exercise);
    Task<bool> UpdateAsync(Exercise exercise);
    Task<bool> DeleteAsync(int id);
}
