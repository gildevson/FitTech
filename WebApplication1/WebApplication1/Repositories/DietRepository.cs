using Dapper;

public class DietRepository : IDietRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public DietRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Diet>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Diet>(
            "SELECT id, name, description, created_by AS CreatedBy, created_at AS CreatedAt FROM diets ORDER BY created_at DESC");
    }

    public async Task<DietResponseDto?> GetByIdAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();

        var diet = await conn.QueryFirstOrDefaultAsync<Diet>(
            "SELECT id, name, description, created_by AS CreatedBy, created_at AS CreatedAt FROM diets WHERE id = @Id",
            new { Id = id });

        if (diet is null) return null;

        var meals = await conn.QueryAsync<Meal>(
            "SELECT id, diet_id AS DietId, name, meal_order AS MealOrder, meal_time AS MealTime FROM meals WHERE diet_id = @DietId ORDER BY meal_order",
            new { DietId = id });

        var mealList = meals.ToList();

        var mealDtos = new List<MealResponseDto>();

        foreach (var meal in mealList)
        {
            var foods = await conn.QueryAsync<MealFood>(
                "SELECT id, meal_id AS MealId, food_name AS FoodName, quantity_grams AS QuantityGrams, calories, protein, carbs, fat, serving_unit AS ServingUnit, serving_grams AS ServingGrams FROM meal_foods WHERE meal_id = @MealId ORDER BY id",
                new { MealId = meal.Id });

            mealDtos.Add(new MealResponseDto
            {
                Id = meal.Id,
                DietId = meal.DietId,
                Name = meal.Name,
                MealOrder = meal.MealOrder,
                MealTime = meal.MealTime,
                Foods = foods.Select(f => new MealFoodResponseDto
                {
                    Id = f.Id,
                    MealId = f.MealId,
                    FoodName = f.FoodName,
                    QuantityGrams = f.QuantityGrams,
                    Calories = f.Calories,
                    Protein = f.Protein,
                    Carbs = f.Carbs,
                    Fat = f.Fat,
                    ServingUnit = f.ServingUnit,
                    ServingGrams = f.ServingGrams
                }).ToList()
            });
        }

        return new DietResponseDto
        {
            Id = diet.Id,
            Name = diet.Name,
            Description = diet.Description,
            CreatedAt = diet.CreatedAt,
            Meals = mealDtos
        };
    }

    public async Task<Guid> CreateAsync(Diet diet)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            "INSERT INTO diets (name, description, created_by) VALUES (@Name, @Description, @CreatedBy) RETURNING id",
            new { diet.Name, diet.Description, diet.CreatedBy });
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM diets WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
