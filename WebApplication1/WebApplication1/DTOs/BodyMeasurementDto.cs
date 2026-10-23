/// <summary>Sexo ("M" ou "F"), altura em cm e data de nascimento: usados na gordura corporal e no IMC (classificação por idade).</summary>
public class BodyProfileDto
{
    public string? Sex { get; set; }
    public decimal? HeightCm { get; set; }
    public DateTime? BirthDate { get; set; }
}

public class SaveBodyMeasurementDto
{
    /// <summary>Sem data, usa o dia de hoje (horário de Brasília).</summary>
    public DateTime? MeasuredDate { get; set; }

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

    public IEnumerable<decimal?> Values() => new[]
    {
        WeightKg, NeckCm, ShouldersCm, ChestCm, WaistCm, HipCm, RightArmCm, LeftArmCm,
        RightThighCm, LeftThighCm, RightCalfCm, LeftCalfCm
    }.Concat(Skinfolds());

    public IEnumerable<decimal?> Skinfolds() => new[]
    {
        SkinfoldChestMm, SkinfoldAxillaMm, SkinfoldTricepsMm, SkinfoldSubscapularMm,
        SkinfoldAbdomenMm, SkinfoldSuprailiacMm, SkinfoldThighMm
    };
}
