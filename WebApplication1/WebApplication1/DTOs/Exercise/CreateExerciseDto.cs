public class CreateExerciseDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid MuscleGroupId { get; set; }
    public string? ImageUrl { get; set; }
}
