using Dapper;

public class MealFoodRepository : IMealFoodRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public MealFoodRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<MealFood>> GetByMealIdAsync(Guid mealId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<MealFood>(
            "SELECT id, meal_id AS MealId, food_name AS FoodName, quantity_grams AS QuantityGrams, calories, protein, carbs, fat, open_food_facts_id AS OpenFoodFactsId, serving_unit AS ServingUnit, serving_grams AS ServingGrams FROM meal_foods WHERE meal_id = @MealId ORDER BY id",
            new { MealId = mealId });
    }

    public async Task<Guid> CreateAsync(MealFood food)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            "INSERT INTO meal_foods (meal_id, food_name, quantity_grams, calories, protein, carbs, fat, open_food_facts_id, serving_unit, serving_grams) VALUES (@MealId, @FoodName, @QuantityGrams, @Calories, @Protein, @Carbs, @Fat, @OpenFoodFactsId, @ServingUnit, @ServingGrams) RETURNING id",
            new { food.MealId, food.FoodName, food.QuantityGrams, food.Calories, food.Protein, food.Carbs, food.Fat, food.OpenFoodFactsId, food.ServingUnit, food.ServingGrams });
    }

    public async Task<bool> UpdateAsync(MealFood food)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE meal_foods SET food_name=@FoodName, quantity_grams=@QuantityGrams, calories=@Calories, protein=@Protein, carbs=@Carbs, fat=@Fat, serving_unit=@ServingUnit, serving_grams=@ServingGrams WHERE id=@Id",
            new { food.FoodName, food.QuantityGrams, food.Calories, food.Protein, food.Carbs, food.Fat, food.ServingUnit, food.ServingGrams, food.Id });
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM meal_foods WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
