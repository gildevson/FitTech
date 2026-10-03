public interface IMuscleGroupRepository
{
    Task<IEnumerable<MuscleGroup>> GetAllAsync();
    Task<MuscleGroup?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(MuscleGroup muscleGroup);
    Task<bool> UpdateAsync(MuscleGroup muscleGroup);
    Task<bool> DeleteAsync(Guid id);
}
