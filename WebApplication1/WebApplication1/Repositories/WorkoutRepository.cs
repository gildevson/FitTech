using Dapper;

public class WorkoutRepository : IWorkoutRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public WorkoutRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    private const string SelectWithJoin = """
        SELECT w.id, w.workout_plan_id AS WorkoutPlanId, w.name,
               w.day_of_week AS DayOfWeek, w.order_index AS OrderIndex,
               w.created_at AS CreatedAt, wp.name AS WorkoutPlanName
        FROM workouts w
        LEFT JOIN workout_plans wp ON w.workout_plan_id = wp.id
        """;

    public async Task<IEnumerable<Workout>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Workout>(SelectWithJoin + " ORDER BY w.order_index, w.name");
    }

    public async Task<IEnumerable<Workout>> GetByWorkoutPlanAsync(int workoutPlanId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Workout>(
            SelectWithJoin + " WHERE w.workout_plan_id = @WorkoutPlanId ORDER BY w.order_index",
            new { WorkoutPlanId = workoutPlanId });
    }

    public async Task<Workout?> GetByIdAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Workout>(
            SelectWithJoin + " WHERE w.id = @Id", new { Id = id });
    }

    public async Task<int> CreateAsync(Workout workout)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<int>("""
            INSERT INTO workouts (workout_plan_id, name, day_of_week, order_index)
            VALUES (@WorkoutPlanId, @Name, @DayOfWeek, @OrderIndex)
            RETURNING id
            """, workout);
    }

    public async Task<bool> UpdateAsync(Workout workout)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("""
            UPDATE workouts SET name = @Name, day_of_week = @DayOfWeek,
            order_index = @OrderIndex, workout_plan_id = @WorkoutPlanId
            WHERE id = @Id
            """, workout);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM workouts WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
