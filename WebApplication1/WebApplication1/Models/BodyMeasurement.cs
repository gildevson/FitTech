public class BodyMeasurement
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime MeasuredDate { get; set; }

    public decimal? WeightKg { get; set; }
    public decimal? NeckCm { get; set; }
    public decimal? ShouldersCm { get; set; }
    public decimal? ChestCm { get; set; }
    public decimal? WaistCm { get; set; }
    public decimal? HipCm { get; set; }
    public decimal? RightArmCm { get; set; }
    public decimal? LeftArmCm { get; set; }
    public decimal? RightThighCm { get; set; }
    public decimal? LeftThighCm { get; set; }
    public decimal? RightCalfCm { get; set; }
    public decimal? LeftCalfCm { get; set; }

    // Dobras cutâneas (adipômetro), em mm — opcionais
    public decimal? SkinfoldChestMm { get; set; }
    public decimal? SkinfoldAxillaMm { get; set; }
    public decimal? SkinfoldTricepsMm { get; set; }
    public decimal? SkinfoldSubscapularMm { get; set; }
    public decimal? SkinfoldAbdomenMm { get; set; }
    public decimal? SkinfoldSuprailiacMm { get; set; }
    public decimal? SkinfoldThighMm { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
