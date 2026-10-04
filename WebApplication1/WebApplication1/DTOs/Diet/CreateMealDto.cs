public class CreateMealDto
{
    public Guid DietId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MealOrder { get; set; }
    public string MealTime { get; set; } = string.Empty;
}
