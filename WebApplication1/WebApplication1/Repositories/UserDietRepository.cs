using Dapper;

public class UserDietRepository : IUserDietRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public UserDietRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task AssignAsync(Guid userId, Guid dietId)
    {
        using var conn = _connectionFactory.CreateConnection();
        await conn.ExecuteAsync(
            "INSERT INTO user_diets (user_id, diet_id) VALUES (@UserId, @DietId) ON CONFLICT (user_id, diet_id) DO NOTHING",
            new { UserId = userId, DietId = dietId });
    }

    public async Task<IEnumerable<Guid>> GetByUserIdAsync(Guid userId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Guid>(
            "SELECT diet_id FROM user_diets WHERE user_id = @UserId",
            new { UserId = userId });
    }

    public async Task<IEnumerable<DietResponseDto>> GetDietsByUserIdAsync(Guid userId)
    {
        using var conn = _connectionFactory.CreateConnection();

        var diets = await conn.QueryAsync<Diet>(
            @"SELECT d.id, d.name, d.description, d.created_by AS CreatedBy, d.created_at AS CreatedAt
              FROM diets d
              INNER JOIN user_diets ud ON ud.diet_id = d.id
              WHERE ud.user_id = @UserId
              ORDER BY d.created_at DESC",
            new { UserId = userId });

        var result = new List<DietResponseDto>();

        foreach (var diet in diets)
        {
            var meals = await conn.QueryAsync<Meal>(
                "SELECT id, diet_id AS DietId, name, meal_order AS MealOrder FROM meals WHERE diet_id = @DietId ORDER BY meal_order",
                new { DietId = diet.Id });

            var mealDtos = new List<MealResponseDto>();

            foreach (var meal in meals)
            {
                var foods = await conn.QueryAsync<MealFood>(
                    "SELECT id, meal_id AS MealId, food_name AS FoodName, quantity_grams AS QuantityGrams, calories, protein, carbs, fat FROM meal_foods WHERE meal_id = @MealId ORDER BY id",
                    new { MealId = meal.Id });

                mealDtos.Add(new MealResponseDto
                {
                    Id = meal.Id,
                    DietId = meal.DietId,
                    Name = meal.Name,
                    MealOrder = meal.MealOrder,
                    Foods = foods.Select(f => new MealFoodResponseDto
                    {
                        Id = f.Id,
                        MealId = f.MealId,
                        FoodName = f.FoodName,
                        QuantityGrams = f.QuantityGrams,
                        Calories = f.Calories,
                        Protein = f.Protein,
                        Carbs = f.Carbs,
                        Fat = f.Fat
                    }).ToList()
                });
            }

            result.Add(new DietResponseDto
            {
                Id = diet.Id,
                Name = diet.Name,
                Description = diet.Description,
                CreatedAt = diet.CreatedAt,
                Meals = mealDtos
            });
        }

        return result;
    }
}
