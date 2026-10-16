using Dapper;

public class UserRepository : IUserRepository
{
    private readonly DbConnectionFactory _connectionFactory;

    private const string SelectColumns =
        "id, name, email, password_hash AS PasswordHash, role, is_active AS IsActive, created_at AS CreatedAt, " +
        "zip_code AS ZipCode, street, address_number AS AddressNumber, complement, neighborhood, city, state, language";

    public UserRepository(DbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<User>($"SELECT {SelectColumns} FROM users ORDER BY name");
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            $"SELECT {SelectColumns} FROM users WHERE id = @Id",
            new { Id = id });
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            $"SELECT {SelectColumns} FROM users WHERE email = @Email",
            new { Email = email });
    }

    public async Task<Guid> CreateAsync(User user)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<Guid>(
            @"INSERT INTO users (name, email, password_hash, role, is_active,
                                 zip_code, street, address_number, complement, neighborhood, city, state, language)
              VALUES (@Name, @Email, @PasswordHash, @Role, @IsActive,
                      @ZipCode, @Street, @AddressNumber, @Complement, @Neighborhood, @City, @State, @Language)
              RETURNING id",
            user);
    }

    public async Task<bool> UpdateAsync(User user)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            @"UPDATE users SET name = @Name, email = @Email, role = @Role, is_active = @IsActive,
                     zip_code = @ZipCode, street = @Street, address_number = @AddressNumber,
                     complement = @Complement, neighborhood = @Neighborhood, city = @City, state = @State
              WHERE id = @Id",
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

    public async Task<IEnumerable<UsersByStateDto>> CountByStateAsync()
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<UsersByStateDto>(
            @"SELECT state, COUNT(*)::int AS Total, COUNT(*) FILTER (WHERE is_active)::int AS Active
              FROM users
              WHERE state IS NOT NULL AND role = 'user'
              GROUP BY state
              ORDER BY Total DESC");
    }

    public async Task<IEnumerable<UsersByCityDto>> CountByCityAsync(string state)
    {
        using var conn = _connectionFactory.CreateConnection();
        return await conn.QueryAsync<UsersByCityDto>(
            @"SELECT city, COUNT(*)::int AS Total, COUNT(*) FILTER (WHERE is_active)::int AS Active
              FROM users
              WHERE UPPER(state) = UPPER(@State) AND city IS NOT NULL AND city <> '' AND role = 'user'
              GROUP BY city
              ORDER BY Total DESC, city",
            new { State = state });
    }

    public async Task<bool> UpdateLanguageAsync(Guid id, string language)
    {
        using var conn = _connectionFactory.CreateConnection();
        var rows = await conn.ExecuteAsync(
            "UPDATE users SET language = @Language WHERE id = @Id", new { Language = language, Id = id });
        return rows > 0;
    }
}
