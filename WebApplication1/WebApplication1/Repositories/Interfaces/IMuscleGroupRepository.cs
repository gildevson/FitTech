public interface IMuscleGroupRepository
{
    Task<IEnumerable<MuscleGroup>> GetAllAsync();
    Task<MuscleGroup?> GetByIdAsync(int id);
    Task<int> CreateAsync(MuscleGroup muscleGroup);
    Task<bool> UpdateAsync(MuscleGroup muscleGroup);
    Task<bool> DeleteAsync(int id);
}
