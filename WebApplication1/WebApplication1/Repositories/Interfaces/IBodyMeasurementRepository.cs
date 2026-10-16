public interface IBodyMeasurementRepository
{
    Task<IEnumerable<BodyMeasurement>> GetByUserAsync(Guid userId);
    Task<BodyMeasurement> CreateAsync(Guid userId, DateTime date, SaveBodyMeasurementDto dto);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<BodyProfileDto> GetProfileAsync(Guid userId);
    Task SaveProfileAsync(Guid userId, string? sex, decimal? heightCm, DateTime? birthDate);
}
