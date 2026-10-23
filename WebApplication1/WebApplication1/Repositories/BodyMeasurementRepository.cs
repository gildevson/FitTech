using Dapper;

public class BodyMeasurementRepository : IBodyMeasurementRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    private const string SelectColumns =
        @"id, user_id AS UserId, measured_date AS MeasuredDate, weight_kg AS WeightKg, neck_cm AS NeckCm,
          shoulders_cm AS ShouldersCm, chest_cm AS ChestCm, waist_cm AS WaistCm, hip_cm AS HipCm,
          right_arm_cm AS RightArmCm, left_arm_cm AS LeftArmCm, right_thigh_cm AS RightThighCm,
          left_thigh_cm AS LeftThighCm, right_calf_cm AS RightCalfCm, left_calf_cm AS LeftCalfCm,
          skinfold_chest_mm AS SkinfoldChestMm, skinfold_axilla_mm AS SkinfoldAxillaMm,
          skinfold_triceps_mm AS SkinfoldTricepsMm, skinfold_subscapular_mm AS SkinfoldSubscapularMm,
          skinfold_abdomen_mm AS SkinfoldAbdomenMm, skinfold_suprailiac_mm AS SkinfoldSuprailiacMm,
          skinfold_thigh_mm AS SkinfoldThighMm,
          notes, created_at AS CreatedAt";

    public BodyMeasurementRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<BodyMeasurement>> GetByUserAsync(Guid userId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<BodyMeasurement>(
            $"SELECT {SelectColumns} FROM body_measurements WHERE user_id = @UserId ORDER BY measured_date DESC, created_at DESC",
            new { UserId = userId });
    }

    public async Task<BodyMeasurement> CreateAsync(Guid userId, DateTime date, SaveBodyMeasurementDto dto)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QuerySingleAsync<BodyMeasurement>(
            $@"INSERT INTO body_measurements
                 (user_id, measured_date, weight_kg, neck_cm, shoulders_cm, chest_cm, waist_cm, hip_cm,
                  right_arm_cm, left_arm_cm, right_thigh_cm, left_thigh_cm, right_calf_cm, left_calf_cm,
                  skinfold_chest_mm, skinfold_axilla_mm, skinfold_triceps_mm, skinfold_subscapular_mm,
                  skinfold_abdomen_mm, skinfold_suprailiac_mm, skinfold_thigh_mm, notes)
               VALUES
                 (@UserId, @Date, @WeightKg, @NeckCm, @ShouldersCm, @ChestCm, @WaistCm, @HipCm,
                  @RightArmCm, @LeftArmCm, @RightThighCm, @LeftThighCm, @RightCalfCm, @LeftCalfCm,
                  @SkinfoldChestMm, @SkinfoldAxillaMm, @SkinfoldTricepsMm, @SkinfoldSubscapularMm,
                  @SkinfoldAbdomenMm, @SkinfoldSuprailiacMm, @SkinfoldThighMm, @Notes)
               RETURNING {SelectColumns}",
            new
            {
                UserId = userId,
                Date = date,
                dto.WeightKg, dto.NeckCm, dto.ShouldersCm, dto.ChestCm, dto.WaistCm, dto.HipCm,
                dto.RightArmCm, dto.LeftArmCm, dto.RightThighCm, dto.LeftThighCm, dto.RightCalfCm, dto.LeftCalfCm,
                dto.SkinfoldChestMm, dto.SkinfoldAxillaMm, dto.SkinfoldTricepsMm, dto.SkinfoldSubscapularMm,
                dto.SkinfoldAbdomenMm, dto.SkinfoldSuprailiacMm, dto.SkinfoldThighMm,
                dto.Notes
            });
    }

    public async Task<BodyProfileDto> GetProfileAsync(Guid userId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<BodyProfileDto>(
            "SELECT sex AS Sex, height_cm AS HeightCm, birth_date AS BirthDate FROM users WHERE id = @UserId",
            new { UserId = userId }) ?? new BodyProfileDto();
    }

    public async Task SaveProfileAsync(Guid userId, string? sex, decimal? heightCm, DateTime? birthDate)
    {
        using var conn = _connectionFactory.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE users SET sex = @Sex, height_cm = @HeightCm, birth_date = @BirthDate WHERE id = @UserId",
            new { UserId = userId, Sex = sex, HeightCm = heightCm, BirthDate = birthDate?.Date });
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM body_measurements WHERE id = @Id AND user_id = @UserId",
            new { Id = id, UserId = userId });
        return rows > 0;
    }
}
