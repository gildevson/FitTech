using Dapper;

public class ExerciseRepository : IExerciseRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public ExerciseRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    private const string SelectWithJoin = """
        SELECT e.id, e.name, e.description, e.muscle_group_id AS MuscleGroupId,
               e.image_url AS ImageUrl, e.created_at AS CreatedAt,
               mg.name AS MuscleGroupName
        FROM exercises e
        LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
        """;

    public async Task<IEnumerable<Exercise>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Exercise>(SelectWithJoin + " ORDER BY e.name");
    }

    public async Task<IEnumerable<Exercise>> GetByMuscleGroupAsync(int muscleGroupId)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<Exercise>(
            SelectWithJoin + " WHERE e.muscle_group_id = @MuscleGroupId ORDER BY e.name",
            new { MuscleGroupId = muscleGroupId });
    }

    public async Task<Exercise?> GetByIdAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Exercise>(
            SelectWithJoin + " WHERE e.id = @Id", new { Id = id });
    }

    public async Task<int> CreateAsync(Exercise exercise)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<int>("""
            INSERT INTO exercises (name, description, muscle_group_id, image_url)
            VALUES (@Name, @Description, @MuscleGroupId, @ImageUrl)
            RETURNING id
            """, exercise);
    }

    public async Task<bool> UpdateAsync(Exercise exercise)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("""
            UPDATE exercises SET name = @Name, description = @Description,
            muscle_group_id = @MuscleGroupId, image_url = @ImageUrl
            WHERE id = @Id
            """, exercise);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM exercises WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
