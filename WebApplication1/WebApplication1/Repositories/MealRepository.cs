using Dapper;

public class MealRepository : IMealRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public MealRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Meal>> GetByDietIdAsync(Guid dietId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Meal>(
            "SELECT id, diet_id AS DietId, name, meal_order AS MealOrder, meal_time AS MealTime FROM meals WHERE diet_id = @DietId ORDER BY meal_order",
            new { DietId = dietId });
    }

    public async Task<Guid> CreateAsync(Meal meal)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            "INSERT INTO meals (diet_id, name, meal_order, meal_time, created_by) VALUES (@DietId, @Name, @MealOrder, @MealTime, @CreatedBy) RETURNING id",
            new { meal.DietId, meal.Name, meal.MealOrder, meal.MealTime, meal.CreatedBy });
    }

    public async Task<bool> UpdateAsync(Meal meal)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE meals SET name = @Name, meal_order = @MealOrder, meal_time = @MealTime WHERE id = @Id",
            new { meal.Name, meal.MealOrder, meal.MealTime, Id = meal.Id });
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM meals WHERE id = @Id", new { Id = id });
        return rows > 0;
    }

    public async Task<Guid?> GetDietOwnerAsync(Guid mealId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid?>(
            "SELECT d.created_by FROM meals m JOIN diets d ON d.id = m.diet_id WHERE m.id = @MealId",
            new { MealId = mealId });
    }

    public async Task<Guid?> GetDietOwnerByFoodAsync(Guid foodId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid?>(
            @"SELECT d.created_by FROM meal_foods f
              JOIN meals m ON m.id = f.meal_id
              JOIN diets d ON d.id = m.diet_id
              WHERE f.id = @FoodId",
            new { FoodId = foodId });
    }

    public async Task<Guid?> GetMealCreatorAsync(Guid mealId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid?>("SELECT created_by FROM meals WHERE id = @Id", new { Id = mealId });
    }

    public async Task<Guid?> GetFoodCreatorAsync(Guid foodId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid?>("SELECT created_by FROM meal_foods WHERE id = @Id", new { Id = foodId });
    }

    public async Task<bool> ExistsAsync(Guid mealId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<bool>("SELECT EXISTS(SELECT 1 FROM meals WHERE id = @MealId)", new { MealId = mealId });
    }

    public async Task<bool> UpdateTimeAsync(Guid mealId, string mealTime)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE meals SET meal_time = @MealTime WHERE id = @Id", new { MealTime = mealTime, Id = mealId });
        return rows > 0;
    }

    public async Task<Dictionary<Guid, string>> GetUserTimesAsync(Guid userId, Guid dietId)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.QueryAsync<(Guid MealId, string MealTime)>(
            @"SELECT umt.meal_id, umt.meal_time FROM user_meal_times umt
              JOIN meals m ON m.id = umt.meal_id
              WHERE umt.user_id = @UserId AND m.diet_id = @DietId",
            new { UserId = userId, DietId = dietId });
        return rows.ToDictionary(r => r.MealId, r => r.MealTime);
    }

    public async Task SetUserTimeAsync(Guid userId, Guid mealId, string mealTime)
    {
        using var conn = _connectionFactory.CreateConnection();
        await conn.ExecuteAsync(
            @"INSERT INTO user_meal_times (user_id, meal_id, meal_time) VALUES (@UserId, @MealId, @MealTime)
              ON CONFLICT (user_id, meal_id) DO UPDATE SET meal_time = EXCLUDED.meal_time",
            new { UserId = userId, MealId = mealId, MealTime = mealTime });
    }

    public async Task DeleteUserTimeAsync(Guid userId, Guid mealId)
    {
        using var conn = _connectionFactory.CreateConnection();
        await conn.ExecuteAsync(
            "DELETE FROM user_meal_times WHERE user_id = @UserId AND meal_id = @MealId",
            new { UserId = userId, MealId = mealId });
    }
}
