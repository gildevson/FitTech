/// <summary>Resumo de um mês para comparar a frequência entre meses.</summary>
public class MonthlyFrequencyDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    /// <summary>Dias com pelo menos um treino feito</summary>
    public int DoneDays { get; set; }
    /// <summary>Dias em que só pulou treino (nenhum feito)</summary>
    public int SkippedDays { get; set; }
    /// <summary>Total de treinos feitos (um dia pode ter mais de um)</summary>
    public int Workouts { get; set; }
}
