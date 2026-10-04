public interface IMealRepository
{
    Task<IEnumerable<Meal>> GetByDietIdAsync(Guid dietId);
    Task<Guid> CreateAsync(Meal meal);
    Task<bool> UpdateAsync(Meal meal);
    Task<bool> DeleteAsync(Guid id);
}
