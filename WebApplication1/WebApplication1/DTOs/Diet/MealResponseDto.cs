public class MealResponseDto
{
    public Guid Id { get; set; }
    public Guid DietId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MealOrder { get; set; }
    public string MealTime { get; set; } = string.Empty;
    // Preenchido quando o aluno definiu um horário só dele
    public string? OriginalMealTime { get; set; }
    public Guid? CreatedBy { get; set; }
    public List<MealFoodResponseDto> Foods { get; set; } = new();
}
