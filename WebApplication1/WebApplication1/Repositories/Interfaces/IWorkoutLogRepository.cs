public interface IWorkoutLogRepository
{
    Task<IEnumerable<WorkoutLog>> GetByUserAsync(Guid userId, int days = 60);
    Task<WorkoutLog?> CreateAsync(Guid userId, Guid workoutId, DateTime date, string status = "done", string? skipReason = null);
    Task DeleteAsync(Guid id, Guid userId);
    Task<WorkoutStatsDto> GetStatsAsync();
    Task<IEnumerable<UserWorkoutStatsDto>> GetUserStatsAsync();
    Task<IEnumerable<UserWorkoutLogDto>> GetUserLogsAsync(Guid userId);
    Task<IEnumerable<UserWorkoutLogDto>> GetByPeriodAsync(Guid userId, DateTime from, DateTime to);
    Task<bool> ReplaceSetsAsync(Guid logId, Guid userId, IEnumerable<WorkoutSetLogDto> sets);
    Task<IEnumerable<WorkoutSetLogDto>> GetLastSetsAsync(Guid userId, Guid workoutId);
}
