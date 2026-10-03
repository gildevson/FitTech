public class Exercise
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid MuscleGroupId { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    // Navigation (populated by JOIN)
    public string? MuscleGroupName { get; set; }
}
