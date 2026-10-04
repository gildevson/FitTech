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
            "INSERT INTO meals (diet_id, name, meal_order, meal_time) VALUES (@DietId, @Name, @MealOrder, @MealTime) RETURNING id",
            new { meal.DietId, meal.Name, meal.MealOrder, meal.MealTime });
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
}
