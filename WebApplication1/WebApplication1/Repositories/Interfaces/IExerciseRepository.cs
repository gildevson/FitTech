public interface IExerciseRepository
{
    Task<IEnumerable<Exercise>> GetAllAsync();
    Task<IEnumerable<Exercise>> GetByMuscleGroupAsync(Guid muscleGroupId);
    Task<Exercise?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(Exercise exercise);
    Task<bool> UpdateAsync(Exercise exercise);
    Task<bool> DeleteAsync(Guid id);
}
