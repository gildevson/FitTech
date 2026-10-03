using Dapper;

public class UserRepository : IUserRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    public UserRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<User>(
            "SELECT id, name, email, password_hash AS PasswordHash, role, is_active AS IsActive, created_at AS CreatedAt FROM users ORDER BY name");
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT id, name, email, password_hash AS PasswordHash, role, is_active AS IsActive, created_at AS CreatedAt FROM users WHERE id = @Id",
            new { Id = id });
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT id, name, email, password_hash AS PasswordHash, role, is_active AS IsActive, created_at AS CreatedAt FROM users WHERE email = @Email",
            new { Email = email });
    }

    public async Task<Guid> CreateAsync(User user)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (@Name, @Email, @PasswordHash, @Role, @IsActive) RETURNING id",
            user);
    }

    public async Task<bool> UpdateAsync(User user)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE users SET name = @Name, email = @Email, role = @Role, is_active = @IsActive WHERE id = @Id",
            user);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM users WHERE id = @Id", new { Id = id });
        return rows > 0;
    }

    public async Task<bool> ToggleActiveAsync(Guid id, bool isActive)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE users SET is_active = @IsActive WHERE id = @Id",
            new { Id = id, IsActive = isActive });
        return rows > 0;
    }
}
