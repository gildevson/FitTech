using Dapper;

public class MuscleGroupRepository : IMuscleGroupRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public MuscleGroupRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<MuscleGroup>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<MuscleGroup>(
            "SELECT id, name, description, created_at AS CreatedAt FROM muscle_groups ORDER BY name");
    }

    public async Task<MuscleGroup?> GetByIdAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<MuscleGroup>(
            "SELECT id, name, description, created_at AS CreatedAt FROM muscle_groups WHERE id = @Id",
            new { Id = id });
    }

    public async Task<int> CreateAsync(MuscleGroup muscleGroup)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "INSERT INTO muscle_groups (name, description) VALUES (@Name, @Description) RETURNING id",
            muscleGroup);
    }

    public async Task<bool> UpdateAsync(MuscleGroup muscleGroup)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE muscle_groups SET name = @Name, description = @Description WHERE id = @Id",
            muscleGroup);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "DELETE FROM muscle_groups WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
