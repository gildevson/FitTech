using Dapper;

public class UserWorkoutAssignmentRepository : IUserWorkoutAssignmentRepository
{
    private readonly DbConnectionFactory _db;
    public UserWorkoutAssignmentRepository(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<WorkoutAssigneeDto>> GetAssigneesAsync(Guid workoutId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<WorkoutAssigneeDto>(
            @"SELECT a.id AS AssignmentId, a.user_id AS UserId,
                     u.name AS UserName, u.email AS UserEmail, a.assigned_at AS AssignedAt
              FROM user_workout_assignments a
              JOIN users u ON u.id = a.user_id
              WHERE a.workout_id = @WorkoutId
              ORDER BY u.name",
            new { WorkoutId = workoutId });
    }

    public async Task<IEnumerable<AssignedWorkoutDto>> GetByUserAsync(Guid userId)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<AssignedWorkoutDto>(
            @"SELECT a.id AS Id, w.id AS WorkoutId, w.name AS WorkoutName,
                     wp.name AS PlanName, w.day_of_week AS DayOfWeek, a.assigned_at AS AssignedAt
              FROM user_workout_assignments a
              JOIN workouts w ON w.id = a.workout_id
              JOIN workout_plans wp ON wp.id = w.workout_plan_id
              WHERE a.user_id = @UserId
              ORDER BY w.day_of_week, w.name",
            new { UserId = userId });
    }

    public async Task AssignAsync(Guid workoutId, IEnumerable<Guid> userIds)
    {
        using var conn = _db.CreateConnection();
        foreach (var uid in userIds)
        {
            await conn.ExecuteAsync(
                @"INSERT INTO user_workout_assignments (user_id, workout_id)
                  VALUES (@UserId, @WorkoutId)
                  ON CONFLICT (user_id, workout_id) DO NOTHING",
                new { UserId = uid, WorkoutId = workoutId });
        }
    }

    public async Task UnassignAsync(Guid workoutId, Guid userId)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync(
            "DELETE FROM user_workout_assignments WHERE workout_id = @WorkoutId AND user_id = @UserId",
            new { WorkoutId = workoutId, UserId = userId });
    }
}
