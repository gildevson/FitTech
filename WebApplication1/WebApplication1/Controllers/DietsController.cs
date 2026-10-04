using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DietsController : ControllerBase
{
    private readonly IDietRepository _dietRepository;
    private readonly IMealRepository _mealRepository;
    private readonly IMealFoodRepository _mealFoodRepository;
    private readonly IUserDietRepository _userDietRepository;
    private readonly IHttpClientFactory _httpClientFactory;

    public DietsController(
        IDietRepository dietRepository,
        IMealRepository mealRepository,
        IMealFoodRepository mealFoodRepository,
        IUserDietRepository userDietRepository,
        IHttpClientFactory httpClientFactory)
    {
        _dietRepository = dietRepository;
        _mealRepository = mealRepository;
        _mealFoodRepository = mealFoodRepository;
        _userDietRepository = userDietRepository;
        _httpClientFactory = httpClientFactory;
    }

    private record TacoFood(string Name, double Calories, double Protein, double Carbs, double Fat);

    private static readonly List<TacoFood> TacoDatabase =
    [
        new("Arroz branco cozido", 128, 2.5, 28.1, 0.2),
        new("Arroz integral cozido", 124, 2.6, 25.8, 1.0),
        new("Feijão carioca cozido", 76, 4.8, 13.6, 0.5),
        new("Feijão preto cozido", 77, 4.5, 14.0, 0.5),
        new("Feijão verde cozido", 28, 2.0, 5.4, 0.2),
        new("Frango peito grelhado", 163, 31.5, 0.0, 3.2),
        new("Frango coxa cozida", 232, 25.9, 0.0, 14.2),
        new("Carne bovina patinho cozido", 219, 30.7, 0.0, 10.4),
        new("Carne bovina acém cozido", 223, 26.0, 0.0, 13.0),
        new("Carne bovina contrafilé grelhado", 270, 30.5, 0.0, 16.0),
        new("Carne bovina alcatra grelhada", 219, 31.9, 0.0, 9.8),
        new("Carne bovina picanha grelhada", 296, 27.8, 0.0, 20.2),
        new("Carne bovina moída refogada", 211, 22.0, 0.0, 13.4),
        new("Carne suína lombo grelhado", 197, 26.1, 0.0, 10.2),
        new("Carne suína costela cozida", 395, 19.4, 0.0, 34.6),
        new("Ovo cozido", 146, 13.3, 0.6, 9.5),
        new("Ovo mexido", 148, 10.1, 1.5, 11.5),
        new("Ovo frito", 196, 13.6, 0.5, 15.3),
        new("Atum em lata", 128, 26.0, 0.0, 2.5),
        new("Salmão grelhado", 202, 24.2, 0.0, 11.6),
        new("Tilápia cozida", 128, 26.2, 0.0, 2.7),
        new("Macarrão cozido", 149, 6.0, 29.0, 1.3),
        new("Batata doce cozida", 77, 0.6, 18.4, 0.1),
        new("Batata inglesa cozida", 52, 1.2, 11.9, 0.1),
        new("Mandioca cozida", 125, 1.0, 30.1, 0.3),
        new("Pão francês", 300, 8.0, 58.6, 3.1),
        new("Pão integral", 253, 9.4, 46.7, 3.8),
        new("Aveia cozida", 54, 1.9, 9.7, 1.4),
        new("Granola", 380, 9.0, 65.0, 10.0),
        new("Leite integral", 61, 3.2, 4.6, 3.3),
        new("Leite desnatado", 35, 3.4, 4.9, 0.1),
        new("Iogurte natural", 51, 4.1, 4.0, 1.7),
        new("Queijo mussarela", 253, 17.0, 3.6, 19.3),
        new("Queijo prato", 358, 24.6, 1.9, 28.0),
        new("Requeijão cremoso", 228, 9.9, 2.3, 20.2),
        new("Banana prata", 92, 1.3, 23.8, 0.1),
        new("Maçã", 56, 0.3, 15.2, 0.1),
        new("Laranja", 47, 1.0, 11.5, 0.1),
        new("Mamão", 40, 0.5, 10.4, 0.1),
        new("Manga", 64, 0.5, 17.0, 0.3),
        new("Abacate", 96, 1.2, 6.0, 8.4),
        new("Uva", 68, 0.6, 17.7, 0.3),
        new("Morango", 30, 0.8, 7.1, 0.4),
        new("Melancia", 33, 0.9, 8.1, 0.2),
        new("Melão", 29, 0.9, 7.5, 0.1),
        new("Abacaxi", 48, 0.9, 12.3, 0.1),
        new("Alface", 11, 1.3, 2.2, 0.2),
        new("Tomate", 15, 1.0, 3.1, 0.2),
        new("Cenoura crua", 34, 0.9, 7.9, 0.2),
        new("Brócolis cozido", 25, 3.0, 3.7, 0.3),
        new("Espinafre cozido", 21, 2.9, 3.4, 0.3),
        new("Abóbora cozida", 19, 0.7, 4.6, 0.1),
        new("Abobrinha cozida", 16, 0.9, 3.5, 0.1),
        new("Chuchu cozido", 14, 0.4, 3.4, 0.1),
        new("Couve cozida", 28, 2.5, 4.4, 0.5),
        new("Milho cozido", 86, 3.2, 18.7, 1.0),
        new("Ervilha cozida", 70, 5.4, 11.4, 0.2),
        new("Lentilha cozida", 93, 6.3, 16.3, 0.5),
        new("Grão de bico cozido", 164, 8.9, 27.4, 2.6),
        new("Amendoim torrado", 598, 28.5, 17.6, 49.9),
        new("Castanha do Pará", 656, 14.3, 12.3, 63.5),
        new("Castanha de caju torrada", 570, 18.5, 29.1, 46.3),
        new("Azeite de oliva", 884, 0.0, 0.0, 100.0),
        new("Óleo de soja", 884, 0.0, 0.0, 100.0),
        new("Manteiga", 726, 0.5, 0.1, 80.5),
        new("Mel", 309, 0.3, 84.0, 0.0),
        new("Açúcar refinado", 387, 0.0, 99.9, 0.0),
        new("Whey protein", 380, 76.0, 7.0, 6.0),
        new("Peito de peru", 119, 24.4, 0.0, 2.0),
    ];

    [HttpGet("search-food")]
    public async Task<IActionResult> SearchFood([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());

        var q = query.Trim().ToLowerInvariant();

        // 1. Buscar na base TACO local
        var tacoResults = TacoDatabase
            .Where(f => f.Name.ToLowerInvariant().Contains(q))
            .OrderBy(f => f.Name.ToLowerInvariant().StartsWith(q) ? 0 : 1)
            .Take(6)
            .Select(f => new
            {
                name = f.Name,
                code = $"taco:{f.Name.ToLowerInvariant().Replace(" ", "-")}",
                calories = f.Calories,
                protein = f.Protein,
                carbs = f.Carbs,
                fat = f.Fat
            })
            .ToList<object>();

        // 2. Buscar no OpenFoodFacts (sem filtro de idioma para ampliar resultados)
        var offResults = new List<object>();
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "FitTech/1.0");
            var url = $"https://world.openfoodfacts.org/cgi/search.pl?search_terms={Uri.EscapeDataString(query)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,code&page_size=8&countries_tags=brazil";
            var response = await client.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("products", out var products))
                {
                    foreach (var p in products.EnumerateArray())
                    {
                        var name = p.TryGetProperty("product_name", out var n) ? n.GetString() : null;
                        if (string.IsNullOrWhiteSpace(name)) continue;
                        var nutriments = p.TryGetProperty("nutriments", out var nut) ? nut : default;
                        var calories = GetNutriment(nutriments, "energy-kcal_100g");
                        if (calories <= 0) continue; // ignorar produtos sem dados nutricionais
                        offResults.Add(new
                        {
                            name,
                            code = p.TryGetProperty("code", out var c) ? c.GetString() : "",
                            calories,
                            protein = GetNutriment(nutriments, "proteins_100g"),
                            carbs = GetNutriment(nutriments, "carbohydrates_100g"),
                            fat = GetNutriment(nutriments, "fat_100g")
                        });
                    }
                }
            }
        }
        catch { /* OpenFoodFacts indisponível — retorna só TACO */ }

        // TACO primeiro (alimentos base), depois OpenFoodFacts (produtos industrializados)
        var combined = tacoResults.Concat(offResults).Take(12).ToList();
        return Ok(combined);
    }

    private static double GetNutriment(JsonElement nutriments, string key)
    {
        if (nutriments.ValueKind == JsonValueKind.Undefined) return 0;
        return nutriments.TryGetProperty(key, out var val) && val.TryGetDouble(out var d) ? Math.Round(d, 1) : 0;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var diets = await _dietRepository.GetAllAsync();
        return Ok(diets.Select(d => new DietResponseDto
        {
            Id = d.Id,
            Name = d.Name,
            Description = d.Description,
            CreatedAt = d.CreatedAt,
            Meals = new List<MealResponseDto>()
        }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var diet = await _dietRepository.GetByIdAsync(id);
        if (diet is null) return NotFound();
        return Ok(diet);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDietDto dto)
    {
        var diet = new Diet
        {
            Name = dto.Name,
            Description = dto.Description
        };

        var id = await _dietRepository.CreateAsync(diet);
        diet.Id = id;

        return CreatedAtAction(nameof(GetById), new { id }, new DietResponseDto
        {
            Id = diet.Id,
            Name = diet.Name,
            Description = diet.Description,
            CreatedAt = diet.CreatedAt,
            Meals = new List<MealResponseDto>()
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _dietRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/meals")]
    public async Task<IActionResult> AddMeal(Guid id, [FromBody] CreateMealDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.MealTime))
            return BadRequest(new { message = "Horário é obrigatório" });

        var meal = new Meal
        {
            DietId = id,
            Name = dto.Name,
            MealOrder = dto.MealOrder,
            MealTime = dto.MealTime
        };

        var mealId = await _mealRepository.CreateAsync(meal);
        meal.Id = mealId;

        return Ok(new MealResponseDto
        {
            Id = meal.Id,
            DietId = meal.DietId,
            Name = meal.Name,
            MealOrder = meal.MealOrder,
            MealTime = meal.MealTime,
            Foods = new List<MealFoodResponseDto>()
        });
    }

    [HttpPut("meals/{mealId:guid}")]
    public async Task<IActionResult> UpdateMeal(Guid mealId, [FromBody] CreateMealDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.MealTime))
            return BadRequest(new { message = "Horário é obrigatório" });

        var meal = new Meal
        {
            Id = mealId,
            Name = dto.Name,
            MealOrder = dto.MealOrder,
            MealTime = dto.MealTime
        };

        var updated = await _mealRepository.UpdateAsync(meal);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("meals/{mealId:guid}")]
    public async Task<IActionResult> DeleteMeal(Guid mealId)
    {
        var deleted = await _mealRepository.DeleteAsync(mealId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("meals/{mealId:guid}/foods")]
    public async Task<IActionResult> AddFood(Guid mealId, [FromBody] CreateMealFoodDto dto)
    {
        var food = new MealFood
        {
            MealId = mealId,
            FoodName = dto.FoodName,
            QuantityGrams = dto.QuantityGrams,
            Calories = dto.Calories,
            Protein = dto.Protein,
            Carbs = dto.Carbs,
            Fat = dto.Fat,
            OpenFoodFactsId = dto.OpenFoodFactsId,
            ServingUnit = dto.ServingUnit,
            ServingGrams = dto.ServingGrams
        };

        var foodId = await _mealFoodRepository.CreateAsync(food);
        food.Id = foodId;

        return Ok(new MealFoodResponseDto
        {
            Id = food.Id,
            MealId = food.MealId,
            FoodName = food.FoodName,
            QuantityGrams = food.QuantityGrams,
            Calories = food.Calories,
            Protein = food.Protein,
            Carbs = food.Carbs,
            Fat = food.Fat,
            ServingUnit = food.ServingUnit,
            ServingGrams = food.ServingGrams
        });
    }

    [HttpPut("foods/{foodId:guid}")]
    public async Task<IActionResult> UpdateFood(Guid foodId, [FromBody] CreateMealFoodDto dto)
    {
        var food = new MealFood
        {
            Id = foodId,
            MealId = dto.MealId,
            FoodName = dto.FoodName,
            QuantityGrams = dto.QuantityGrams,
            Calories = dto.Calories,
            Protein = dto.Protein,
            Carbs = dto.Carbs,
            Fat = dto.Fat,
            ServingUnit = dto.ServingUnit,
            ServingGrams = dto.ServingGrams
        };
        var updated = await _mealFoodRepository.UpdateAsync(food);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("foods/{foodId:guid}")]
    public async Task<IActionResult> DeleteFood(Guid foodId)
    {
        var deleted = await _mealFoodRepository.DeleteAsync(foodId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignToUser([FromBody] AssignDietDto dto)
    {
        await _userDietRepository.AssignAsync(dto.UserId, dto.DietId);
        return Ok(new { message = "Dieta atribuída com sucesso" });
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetUserDiets(Guid userId)
    {
        var diets = await _userDietRepository.GetDietsByUserIdAsync(userId);
        return Ok(diets);
    }
}
