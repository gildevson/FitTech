public interface IMealRepository
{
    Task<IEnumerable<Meal>> GetByDietIdAsync(Guid dietId);
    Task<Guid> CreateAsync(Meal meal);
    Task<bool> UpdateAsync(Meal meal);
    Task<bool> DeleteAsync(Guid id);
    Task<Guid?> GetDietOwnerAsync(Guid mealId);
    Task<Guid?> GetDietOwnerByFoodAsync(Guid foodId);
    Task<Guid?> GetMealCreatorAsync(Guid mealId);
    Task<Guid?> GetFoodCreatorAsync(Guid foodId);
    Task<bool> ExistsAsync(Guid mealId);
    Task<bool> UpdateTimeAsync(Guid mealId, string mealTime);
    Task<Dictionary<Guid, string>> GetUserTimesAsync(Guid userId, Guid dietId);
    Task SetUserTimeAsync(Guid userId, Guid mealId, string mealTime);
    Task DeleteUserTimeAsync(Guid userId, Guid mealId);
}
