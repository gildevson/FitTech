using Dapper;

public class WorkoutPlanRepository : IWorkoutPlanRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public WorkoutPlanRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<WorkoutPlan>> GetAllAsync(bool systemOnly = false, Guid? userId = null)
    {
        using var conn = _connectionFactory.CreateConnection();
        // systemOnly + userId: planos do sistema e os planos pessoais desse usuário
        var where = systemOnly
            ? (userId.HasValue ? "WHERE user_id IS NULL OR user_id = @UserId" : "WHERE user_id IS NULL")
            : "";
        return await conn.QueryAsync<WorkoutPlan>(
            $"SELECT id, name, description, user_id AS UserId, created_at AS CreatedAt FROM workout_plans {where} ORDER BY name",
            new { UserId = userId });
    }

    public async Task<WorkoutPlan?> GetByIdAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<WorkoutPlan>(
            "SELECT id, name, description, user_id AS UserId, created_at AS CreatedAt FROM workout_plans WHERE id = @Id",
            new { Id = id });
    }

    public async Task<Guid> CreateAsync(WorkoutPlan plan)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            "INSERT INTO workout_plans (name, description, user_id) VALUES (@Name, @Description, @UserId) RETURNING id",
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
