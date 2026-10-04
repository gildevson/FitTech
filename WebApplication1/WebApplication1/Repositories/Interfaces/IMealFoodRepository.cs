public interface IMealFoodRepository
{
    Task<IEnumerable<MealFood>> GetByMealIdAsync(Guid mealId);
    Task<Guid> CreateAsync(MealFood food);
    Task<bool> UpdateAsync(MealFood food);
    Task<bool> DeleteAsync(Guid id);
}
