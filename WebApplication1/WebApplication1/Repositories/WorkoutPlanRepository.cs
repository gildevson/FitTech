using Dapper;

public class WorkoutPlanRepository : IWorkoutPlanRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public WorkoutPlanRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<WorkoutPlan>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<WorkoutPlan>(
            "SELECT id, name, description, created_at AS CreatedAt FROM workout_plans ORDER BY name");
    }

    public async Task<WorkoutPlan?> GetByIdAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<WorkoutPlan>(
            "SELECT id, name, description, created_at AS CreatedAt FROM workout_plans WHERE id = @Id",
            new { Id = id });
    }

    public async Task<Guid> CreateAsync(WorkoutPlan plan)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            "INSERT INTO workout_plans (name, description) VALUES (@Name, @Description) RETURNING id",
            plan);
    }

    public async Task<bool> UpdateAsync(WorkoutPlan plan)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE workout_plans SET name = @Name, description = @Description WHERE id = @Id",
            plan);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM workout_plans WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
