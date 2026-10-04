public class CreateMealFoodDto
{
    public Guid MealId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public decimal QuantityGrams { get; set; }
    public decimal Calories { get; set; }
    public decimal Protein { get; set; }
    public decimal Carbs { get; set; }
    public decimal Fat { get; set; }
    public string? OpenFoodFactsId { get; set; }
    public string? ServingUnit { get; set; }
    public decimal? ServingGrams { get; set; }
}
